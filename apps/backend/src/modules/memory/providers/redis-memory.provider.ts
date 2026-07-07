import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/redis';
import type {
  MemoryDeleteInput,
  MemoryProvider,
  MemoryRecord,
  MemorySaveInput,
  MemorySearchInput,
} from '../memory.types';

export const REDIS_MEMORY_PROVIDER = Symbol('REDIS_MEMORY_PROVIDER');

@Injectable()
export class RedisMemoryProvider implements MemoryProvider {
  constructor(private readonly redisService: RedisService) {}

  async save(input: MemorySaveInput): Promise<MemoryRecord> {
    if (!input.id) {
      throw new Error('Redis memory id is required');
    }

    const ttlSeconds = Number(input.metadata?.ttlSeconds);

    await this.redisService.set(input.id, input.content, {
      ttlSeconds: Number.isInteger(ttlSeconds) && ttlSeconds > 0 ? ttlSeconds : undefined,
    });

    return {
      id: input.id,
      content: input.content,
      metadata: input.metadata ?? {},
    };
  }

  async search(input: MemorySearchInput): Promise<MemoryRecord[]> {
    const content = await this.redisService.get(input.query);

    if (content === null) {
      return [];
    }

    return [
      {
        id: input.query,
        content,
        metadata: {
          userId: input.userId,
        },
      },
    ];
  }

  async delete(input: MemoryDeleteInput): Promise<void> {
    await this.redisService.delete(input.id);
  }
}
