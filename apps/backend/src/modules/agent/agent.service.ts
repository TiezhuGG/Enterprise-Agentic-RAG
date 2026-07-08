import { BadRequestException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import type { ChatHistoryMessage, ChatRequestDto } from '../chat/chat.types';
import { ConversationService, type MessageEntity } from '../conversation';
import type { AgentChatRequestDto, AgentEvent, AgentResponse, AgentRunResult } from './agent.types';
import { AgentGraph } from './graph/agent.graph';
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
    private readonly memoryTool: MemoryTool,
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
    const question = request.question.trim();

    if (!question) {
      throw new BadRequestException('Question is required');
    }

    const historyMessages = await this.getHistoryMessages(context, request.conversationId);

    await this.conversationService.createMessage(context, request.conversationId, {
      content: question,
      metadata: {
        source,
      },
      role: 'USER',
    });

    const finalState = await this.agentGraph.run(
      createInitialAgentState({
        conversationId: request.conversationId,
        executionContext: context,
        historyMessages,
        question,
        request,
      }),
      { onEvent },
    );
    const answer = finalState.answer ?? '';

    await this.conversationService.createMessage(context, request.conversationId, {
      content: answer,
      metadata: {
        citations: finalState.citations,
        executionId: finalState.executionId,
        source,
        trace: finalState.trace,
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

    return finalState;
  }

  private toAgentResponse(finalState: AgentState): AgentResponse {
    return {
      answer: finalState.answer ?? '',
      citations: finalState.citations,
      executionId: finalState.executionId,
      metadata: {
        trace: finalState.trace,
        usedGraph: finalState.needsGraph,
        usedMemory: this.hasMemoryContext(finalState),
        verified: finalState.verified,
      },
    };
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
