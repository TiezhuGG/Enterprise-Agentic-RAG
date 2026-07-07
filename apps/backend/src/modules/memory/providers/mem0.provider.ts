import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '../../../config';
import type {
  MemoryDeleteInput,
  MemoryProvider,
  MemoryRecord,
  MemorySaveInput,
  MemorySearchInput,
} from '../memory.types';

export const MEM0_MEMORY_PROVIDER = Symbol('MEM0_MEMORY_PROVIDER');

interface RawMem0Memory {
  id?: unknown;
  memory?: unknown;
  content?: unknown;
  text?: unknown;
  score?: unknown;
  metadata?: unknown;
}

interface RawMem0Response {
  data?: unknown;
  memories?: unknown;
  results?: unknown;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

@Injectable()
export class Mem0Provider implements MemoryProvider {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(configService: ConfigService) {
    const memoryConfig = configService.getMemoryConfig();

    this.apiUrl = memoryConfig.mem0ApiUrl.replace(/\/+$/, '');
    this.apiKey = memoryConfig.mem0ApiKey;
  }

  save(input: MemorySaveInput): Promise<MemoryRecord> {
    return this.saveMemory(input);
  }

  async saveMemory(input: MemorySaveInput): Promise<MemoryRecord> {
    const response = await fetch(`${this.apiUrl}/memories`, {
      method: 'POST',
      headers: this.createHeaders(),
      body: JSON.stringify({
        memory: input.content,
        metadata: input.metadata ?? {},
        user_id: input.userId,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Mem0 save request failed');
    }

    const payload = (await response.json()) as RawMem0Response | RawMem0Memory;
    const memory = this.toMemoryRecord(this.unwrapSingle(payload), input.content);

    return {
      ...memory,
      metadata: {
        ...memory.metadata,
        ...(input.metadata ?? {}),
      },
    };
  }

  search(input: MemorySearchInput): Promise<MemoryRecord[]> {
    return this.searchMemory(input);
  }

  async searchMemory(input: MemorySearchInput): Promise<MemoryRecord[]> {
    const response = await fetch(`${this.apiUrl}/memories/search`, {
      method: 'POST',
      headers: this.createHeaders(),
      body: JSON.stringify({
        limit: input.limit,
        query: input.query,
        user_id: input.userId,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Mem0 search request failed');
    }

    const payload = (await response.json()) as RawMem0Response | RawMem0Memory[];
    const values = this.unwrapList(payload);

    return values.map((value) => this.toMemoryRecord(value));
  }

  async delete(input: MemoryDeleteInput): Promise<void> {
    const response = await fetch(`${this.apiUrl}/memories/${encodeURIComponent(input.id)}`, {
      method: 'DELETE',
      headers: this.createHeaders(),
      body: JSON.stringify({
        user_id: input.userId,
      }),
    });

    if (!response.ok) {
      throw new ServiceUnavailableException('Mem0 delete request failed');
    }
  }

  private createHeaders(): Record<string, string> {
    return {
      authorization: `Bearer ${this.apiKey}`,
      'content-type': 'application/json',
    };
  }

  private toMemoryRecord(value: RawMem0Memory, fallbackContent = ''): MemoryRecord {
    const id = String(value.id ?? randomUUID());
    const content = String(value.memory ?? value.content ?? value.text ?? fallbackContent);
    const numericScore = Number(value.score);

    return {
      id,
      content,
      score: Number.isFinite(numericScore) ? numericScore : undefined,
      metadata: asRecord(value.metadata),
    };
  }

  private unwrapList(payload: RawMem0Response | RawMem0Memory[]): RawMem0Memory[] {
    if (Array.isArray(payload)) {
      return payload as RawMem0Memory[];
    }

    const values = payload.results ?? payload.memories ?? payload.data;

    return Array.isArray(values) ? (values as RawMem0Memory[]) : [];
  }

  private unwrapSingle(payload: RawMem0Response | RawMem0Memory): RawMem0Memory {
    const values = !Array.isArray(payload) && 'data' in payload ? payload.data : undefined;

    if (Array.isArray(values)) {
      return (values[0] ?? {}) as RawMem0Memory;
    }

    if (values && typeof values === 'object') {
      return values as RawMem0Memory;
    }

    return payload as RawMem0Memory;
  }
}
