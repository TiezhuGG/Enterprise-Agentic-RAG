import { Inject, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import type { ChatHistoryMessage } from '../chat/chat.types';
import { LLM_PROVIDER, type LlmProvider } from '../chat/providers/llm.provider';
import { MemoryRepository } from './memory.repository';
import type {
  MemoryContext,
  MemoryListResponse,
  MemoryMessage,
  MemoryProvider,
  SaveConversationTurnInput,
} from './memory.types';
import { MEM0_MEMORY_PROVIDER } from './providers/mem0.provider';

const summaryThresholdMessages = 20;
const longTermMemoryLimit = 5;

@Injectable()
export class MemoryService {
  private readonly redisTtlSeconds: number;
  private readonly windowSize: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly memoryRepository: MemoryRepository,
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    @Inject(MEM0_MEMORY_PROVIDER)
    private readonly mem0Provider: MemoryProvider,
  ) {
    const memoryConfig = this.configService.getMemoryConfig();

    this.redisTtlSeconds = memoryConfig.redisTtlSeconds;
    this.windowSize = memoryConfig.windowSize;
  }

  async deleteMemory(context: ExecutionContext, memoryId: string): Promise<void> {
    await this.mem0Provider.delete({
      id: memoryId,
      userId: context.userId,
    });
  }

  async getMemory(
    context: ExecutionContext,
    conversationId: string,
    query: string,
  ): Promise<MemoryContext> {
    const [shortTermMessages, summary, longTermMemories] = await Promise.all([
      this.memoryRepository.getConversationWindow(conversationId, context.userId),
      this.memoryRepository.getSummary(conversationId, context.userId),
      this.mem0Provider.search({
        userId: context.userId,
        query,
        limit: longTermMemoryLimit,
      }),
    ]);

    return {
      shortTermMessages,
      summary,
      longTermMemories,
    };
  }

  async listMemory(context: ExecutionContext, query = ''): Promise<MemoryListResponse> {
    const memories = await this.mem0Provider.search({
      userId: context.userId,
      query,
      limit: longTermMemoryLimit,
    });

    return { memories };
  }

  async saveTurn(context: ExecutionContext, input: SaveConversationTurnInput): Promise<void> {
    const memoryMessages = this.toMemoryMessages(input.messages);
    const windowMessageCount = this.windowSize * 2;
    const recentMessages = memoryMessages.slice(-windowMessageCount);

    await this.memoryRepository.saveConversationWindow(
      input.conversationId,
      context.userId,
      recentMessages,
      this.redisTtlSeconds,
    );

    await Promise.all([
      this.saveSummaryIfNeeded(context, input.conversationId, input.messages),
      this.saveUserFactIfPresent(context, input),
    ]);
  }

  private extractUserFact(question: string): string | null {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      return null;
    }

    const lowerQuestion = normalizedQuestion.toLowerCase();
    const hasPersonalSignal =
      lowerQuestion.includes(' my ') ||
      lowerQuestion.startsWith('my ') ||
      lowerQuestion.startsWith('i ') ||
      lowerQuestion.includes(' i am ') ||
      lowerQuestion.includes(" i'm ") ||
      normalizedQuestion.includes('我') ||
      normalizedQuestion.includes('我的');

    return hasPersonalSignal ? normalizedQuestion.slice(0, 500) : null;
  }

  private async saveSummaryIfNeeded(
    context: ExecutionContext,
    conversationId: string,
    messages: ChatHistoryMessage[],
  ): Promise<void> {
    if (messages.length <= summaryThresholdMessages) {
      return;
    }

    const transcript = messages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n');
    const summary = await this.llmProvider.chat([
      {
        role: 'system',
        content:
          'Summarize the conversation for future context. Keep only durable user intent and decisions.',
      },
      {
        role: 'user',
        content: transcript,
      },
    ]);

    await this.memoryRepository.saveSummary(
      conversationId,
      context.userId,
      summary,
      this.redisTtlSeconds,
    );
  }

  private async saveUserFactIfPresent(
    context: ExecutionContext,
    input: SaveConversationTurnInput,
  ): Promise<void> {
    const fact = this.extractUserFact(input.question);

    if (!fact) {
      return;
    }

    await this.mem0Provider.save({
      userId: context.userId,
      content: fact,
      metadata: {
        conversationId: input.conversationId,
        kind: 'user-fact',
      },
    });
  }

  private toMemoryMessages(messages: ChatHistoryMessage[]): MemoryMessage[] {
    return messages.map((message) => ({
      role: message.role,
      content: message.content,
      createdAt: new Date().toISOString(),
    }));
  }
}
