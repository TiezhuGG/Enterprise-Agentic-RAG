import { Injectable } from '@nestjs/common';
import { RedisClient } from './redis.client';
import type { RedisSetOptions } from './redis.types';

@Injectable()
export class RedisService {
  constructor(private readonly redisClient: RedisClient) {}

  async delete(key: string): Promise<number> {
    return Number(await this.redisClient.command('DEL', key));
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redisClient.command('GET', key);

    return typeof value === 'string' ? value : null;
  }

  async set(key: string, value: string, options: RedisSetOptions = {}): Promise<void> {
    if (options.ttlSeconds) {
      await this.redisClient.command('SET', key, value, 'EX', String(options.ttlSeconds));
      return;
    }

    await this.redisClient.command('SET', key, value);
  }
}
