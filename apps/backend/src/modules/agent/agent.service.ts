import { BadRequestException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import type { ChatHistoryMessage, ChatRequestDto } from '../chat/chat.types';
import { ConversationService, type MessageEntity } from '../conversation';
import { AgentRunResult } from './agent.types';
import { AgentGraph } from './graph/agent.graph';
import { createInitialAgentState } from './graph/agent.state';
import { MemoryTool } from './tools/memory.tool';

@Injectable()
export class AgentService {
  constructor(
    private readonly agentGraph: AgentGraph,
    private readonly configService: ConfigService,
    private readonly conversationService: ConversationService,
    private readonly memoryTool: MemoryTool,
  ) {}

  async chat(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): Promise<AgentRunResult> {
    const question = input.question.trim();

    if (!question) {
      throw new BadRequestException('Question is required');
    }

    const historyMessages = await this.getHistoryMessages(context, conversationId);

    await this.conversationService.createMessage(context, conversationId, {
      content: question,
      metadata: {
        source: 'agent-chat',
      },
      role: 'USER',
    });

    const finalState = await this.agentGraph.run(
      createInitialAgentState({
        conversationId,
        executionContext: context,
        historyMessages,
        question,
        request: input,
      }),
    );
    const answer = finalState.answer ?? '';

    await this.conversationService.createMessage(context, conversationId, {
      content: answer,
      metadata: {
        citations: finalState.citations,
        source: 'agent-chat',
        verified: finalState.verified,
      },
      role: 'ASSISTANT',
    });

    if (this.configService.getAgentConfig().enableMemory) {
      await this.memoryTool.saveTurn(context, {
        answer,
        conversationId,
        messages: await this.getHistoryMessages(context, conversationId),
        question,
      });
    }

    return {
      answer,
      citations: finalState.citations,
      verified: finalState.verified,
    };
  }

  async *stream(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): AsyncIterable<string> {
    const response = await this.chat(context, conversationId, input);

    yield response.answer;
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
