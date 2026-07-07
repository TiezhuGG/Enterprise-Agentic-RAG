import { Inject, Injectable } from '@nestjs/common';
import type { MemoryMessage } from './memory.types';
import { REDIS_MEMORY_PROVIDER, RedisMemoryProvider } from './providers/redis-memory.provider';

const conversationMemoryKey = (conversationId: string): string =>
  `memory:conversation:${conversationId}`;

const summaryMemoryKey = (conversationId: string): string => `memory:summary:${conversationId}`;

@Injectable()
export class MemoryRepository {
  constructor(
    @Inject(REDIS_MEMORY_PROVIDER)
    private readonly redisMemoryProvider: RedisMemoryProvider,
  ) {}

  async deleteConversationMemory(conversationId: string, userId: string): Promise<void> {
    await Promise.all([
      this.redisMemoryProvider.delete({
        id: conversationMemoryKey(conversationId),
        userId,
      }),
      this.redisMemoryProvider.delete({
        id: summaryMemoryKey(conversationId),
        userId,
      }),
    ]);
  }

  async getConversationWindow(conversationId: string, userId: string): Promise<MemoryMessage[]> {
    const records = await this.redisMemoryProvider.search({
      query: conversationMemoryKey(conversationId),
      userId,
    });
    const content = records[0]?.content;

    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content) as unknown;

    return Array.isArray(parsed) ? (parsed as MemoryMessage[]) : [];
  }

  async getSummary(conversationId: string, userId: string): Promise<string | null> {
    const records = await this.redisMemoryProvider.search({
      query: summaryMemoryKey(conversationId),
      userId,
    });

    return records[0]?.content ?? null;
  }

  async saveConversationWindow(
    conversationId: string,
    userId: string,
    messages: MemoryMessage[],
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisMemoryProvider.save({
      id: conversationMemoryKey(conversationId),
      userId,
      content: JSON.stringify(messages),
      metadata: {
        ttlSeconds,
        type: 'conversation-window',
      },
    });
  }

  async saveSummary(
    conversationId: string,
    userId: string,
    summary: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redisMemoryProvider.save({
      id: summaryMemoryKey(conversationId),
      userId,
      content: summary,
      metadata: {
        ttlSeconds,
        type: 'conversation-summary',
      },
    });
  }
}
