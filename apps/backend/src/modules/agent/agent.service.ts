import { BadRequestException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import { ObservabilityService } from '../../infrastructure/observability';
import type { ChatHistoryMessage, ChatRequestDto } from '../chat/chat.types';
import { ConversationService, type MessageEntity } from '../conversation';
import { ExecutionService } from '../execution';
import { MultimodalService } from '../multimodal';
import type { AgentChatRequestDto, AgentEvent, AgentResponse, AgentRunResult } from './agent.types';
import { AgentGraph, type AgentGraphTraceEvent } from './graph/agent.graph';
import type { AgentState } from './graph/agent.state';
import { createInitialAgentState } from './graph/agent.state';
import { MemoryTool } from './tools/memory.tool';

class AgentEventQueue {
  private readonly events: AgentEvent[] = [];
  private readonly resolvers: Array<() => void> = [];
  private closed = false;

  push(event: AgentEvent): void {
    if (this.closed) {
      return;
    }

    this.events.push(event);
    this.notify();
  }

  close(): void {
    this.closed = true;
    this.notify();
  }

  async *drain(): AsyncIterable<AgentEvent> {
    while (!this.closed || this.events.length > 0) {
      if (this.events.length > 0) {
        yield this.events.shift() as AgentEvent;
        continue;
      }

      await new Promise<void>((resolve) => this.resolvers.push(resolve));
    }
  }

  private notify(): void {
    this.resolvers.shift()?.();
  }
}

@Injectable()
export class AgentService {
  constructor(
    private readonly agentGraph: AgentGraph,
    private readonly configService: ConfigService,
    private readonly conversationService: ConversationService,
    private readonly executionService: ExecutionService,
    private readonly memoryTool: MemoryTool,
    private readonly multimodalService: MultimodalService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async execute(context: ExecutionContext, request: AgentChatRequestDto): Promise<AgentResponse> {
    const finalState = await this.runWorkflow(context, request, 'agent-api');

    return this.toAgentResponse(finalState);
  }

  async *executeStream(
    context: ExecutionContext,
    request: AgentChatRequestDto,
  ): AsyncIterable<AgentEvent> {
    const queue = new AgentEventQueue();
    const task = this.runWorkflow(context, request, 'agent-api-stream', (event) =>
      queue.push(event),
    )
      .then((finalState) => {
        for (const citation of finalState.citations) {
          queue.push({
            data: citation,
            type: 'citation',
          });
        }

        queue.push({
          data: this.toAgentResponse(finalState),
          type: 'done',
        });
      })
      .catch((error: unknown) => {
        queue.push({
          data: {
            message: this.toErrorMessage(error),
          },
          type: 'error',
        });
      })
      .finally(() => queue.close());

    for await (const event of queue.drain()) {
      yield event;
    }

    await task;
  }

  async chat(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): Promise<AgentRunResult> {
    const response = await this.execute(context, {
      ...input,
      conversationId,
    });

    return {
      answer: response.answer,
      citations: response.citations,
      verified: response.metadata.verified,
    };
  }

  async *stream(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): AsyncIterable<string> {
    for await (const event of this.executeStream(context, {
      ...input,
      conversationId,
    })) {
      if (event.type === 'token') {
        const token = (event.data as { token?: string }).token;

        if (token) {
          yield token;
        }
      }
    }
  }

  private async runWorkflow(
    context: ExecutionContext,
    request: AgentChatRequestDto,
    source: string,
    onEvent?: (event: AgentEvent) => Promise<void> | void,
  ): Promise<AgentState> {
    const startedAt = Date.now();
    const requestId = this.observabilityService.ensureRequestId(context);
    const executionId = this.observabilityService.ensureExecutionId(context);
    const question = request.question.trim();
    let executionRunStarted = false;

    if (!question) {
      throw new BadRequestException('Question is required');
    }

    try {
      const historyMessages = await this.getHistoryMessages(context, request.conversationId);
      const multimodalContext = await this.multimodalService.buildContext(
        context,
        request.attachmentIds,
        request.conversationId,
      );

      await this.executionService.startRun({
        conversationId: request.conversationId,
        executionId,
        metadata: {
          attachmentCount: request.attachmentIds?.length ?? 0,
          keywordLimit: request.keywordLimit,
          limit: request.limit,
          maxContextTokens: request.maxContextTokens,
          vectorLimit: request.vectorLimit,
        },
        requestId,
        source,
        userId: context.userId,
      });
      executionRunStarted = true;

      await this.conversationService.createMessage(context, request.conversationId, {
        content: question,
        metadata: {
          attachmentIds: request.attachmentIds ?? [],
          executionId,
          requestId,
          source,
        },
        role: 'USER',
      });

      const finalState = await this.agentGraph.run(
        createInitialAgentState({
          conversationId: request.conversationId,
          executionContext: context,
          executionId,
          historyMessages,
          multimodalContext,
          question,
          request,
        }),
        {
          onEvent,
          onTraceEvent: (event) =>
            this.recordExecutionTraceEvent(context, requestId, executionId, event),
        },
      );
      const answer = finalState.answer ?? '';

      await this.conversationService.createMessage(context, request.conversationId, {
        content: answer,
        metadata: {
          citations: finalState.citations,
          executionId: finalState.executionId,
          iteration: finalState.iteration,
          requestId,
          source,
          trace: finalState.trace,
          verificationResult: finalState.verificationResult,
          verified: finalState.verified,
        },
        role: 'ASSISTANT',
      });

      if (this.configService.getAgentConfig().enableMemory) {
        await this.memoryTool.saveTurn(context, {
          answer,
          conversationId: request.conversationId,
          messages: await this.getHistoryMessages(context, request.conversationId),
          question,
        });
      }

      this.observabilityService.recordAgentWorkflow({
        durationMs: Date.now() - startedAt,
        executionId,
        requestId,
        status: 'success',
        usedGraph: finalState.needsGraph,
        usedRetrieval: finalState.needsRetrieval,
        userId: context.userId,
      });
      await this.executionService.finishRun({
        durationMs: Date.now() - startedAt,
        executionId,
        metadata: {
          iteration: finalState.iteration,
          maxIterations: finalState.maxIterations,
          usedGraph: finalState.needsGraph,
          usedMemory: this.hasMemoryContext(finalState),
          usedRetrieval: finalState.needsRetrieval,
          verified: finalState.verified,
        },
        status: 'SUCCEEDED',
      });

      return finalState;
    } catch (error) {
      if (executionRunStarted) {
        await this.safeRecordExecutionFailure(context, requestId, executionId, startedAt, error);
      }

      this.observabilityService.recordAgentWorkflow({
        durationMs: Date.now() - startedAt,
        error,
        executionId,
        requestId,
        status: 'failed',
        userId: context.userId,
      });
      throw error;
    }
  }

  private toAgentResponse(finalState: AgentState): AgentResponse {
    return {
      answer: finalState.answer ?? '',
      citations: finalState.citations,
      executionId: finalState.executionId,
      metadata: {
        iteration: finalState.iteration,
        maxIterations: finalState.maxIterations,
        trace: finalState.trace,
        usedGraph: finalState.needsGraph,
        usedMemory: this.hasMemoryContext(finalState),
        verificationResult: finalState.verificationResult,
        verified: finalState.verified,
      },
    };
  }

  private async recordExecutionTraceEvent(
    context: ExecutionContext,
    requestId: string,
    executionId: string,
    event: AgentGraphTraceEvent,
  ): Promise<void> {
    try {
      await this.executionService.recordEvent({
        durationMs: event.durationMs,
        errorMessage: event.errorMessage,
        executionId,
        metadata: event.metadata,
        node: event.node,
        requestId,
        stage: event.stage,
        status: event.status,
        type: event.type,
        userId: context.userId,
      });
    } catch {
      return;
    }
  }

  private async safeRecordExecutionFailure(
    context: ExecutionContext,
    requestId: string,
    executionId: string,
    startedAt: number,
    error: unknown,
  ): Promise<void> {
    try {
      await this.executionService.recordEvent({
        errorMessage: this.toErrorMessage(error),
        executionId,
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        },
        requestId,
        stage: 'workflow',
        status: 'FAILED',
        type: 'error',
        userId: context.userId,
      });
      await this.executionService.finishRun({
        durationMs: Date.now() - startedAt,
        errorMessage: this.toErrorMessage(error),
        executionId,
        metadata: {
          errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
        },
        status: 'FAILED',
      });
    } catch {
      return;
    }
  }

  private hasMemoryContext(finalState: AgentState): boolean {
    const memoryContext = finalState.memoryContext;

    if (!memoryContext) {
      return false;
    }

    return (
      memoryContext.shortTermMessages.length > 0 ||
      Boolean(memoryContext.summary) ||
      memoryContext.longTermMemories.length > 0
    );
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Agent execution failed';
  }

  private async getHistoryMessages(
    context: ExecutionContext,
    conversationId: string,
  ): Promise<ChatHistoryMessage[]> {
    const messages = await this.conversationService.listMessages(context, conversationId);

    return messages.map((message) => ({
      content: message.content,
      role: this.toChatHistoryRole(message),
    }));
  }

  private toChatHistoryRole(message: MessageEntity): ChatHistoryMessage['role'] {
    switch (message.role) {
      case 'ASSISTANT':
        return 'assistant';
      case 'SYSTEM':
        return 'system';
      case 'USER':
        return 'user';
    }
  }
}
