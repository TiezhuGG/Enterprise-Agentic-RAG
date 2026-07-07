import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { ConfigModule } from '../../config';
import { RedisModule } from '../../infrastructure/redis';
import { AuthModule } from '../auth';
import { LLM_PROVIDER } from '../chat/providers/llm.provider';
import { OpenAiCompatibleLlmProvider } from '../chat/providers/openai-compatible.provider';
import { MemoryController } from './memory.controller';
import { MemoryRepository } from './memory.repository';
import { MemoryService } from './memory.service';
import { MEM0_MEMORY_PROVIDER, Mem0Provider } from './providers/mem0.provider';
import { REDIS_MEMORY_PROVIDER, RedisMemoryProvider } from './providers/redis-memory.provider';

@Module({
  imports: [AuthModule, ConfigModule, RedisModule, RequestContextModule],
  controllers: [MemoryController],
  providers: [
    MemoryRepository,
    MemoryService,
    {
      provide: LLM_PROVIDER,
      useClass: OpenAiCompatibleLlmProvider,
    },
    {
      provide: MEM0_MEMORY_PROVIDER,
      useClass: Mem0Provider,
    },
    {
      provide: REDIS_MEMORY_PROVIDER,
      useClass: RedisMemoryProvider,
    },
  ],
  exports: [MemoryService],
})
export class MemoryModule {}
