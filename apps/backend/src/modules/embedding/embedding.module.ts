import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { VectorModule } from '../../infrastructure/vector';
import { ChunkModule } from '../chunk';
import { EmbeddingService } from './embedding.service';
import { EMBEDDING_PROVIDER } from './providers/embedding.provider';
import { OpenAiCompatibleEmbeddingProvider } from './providers/openai-compatible.provider';

@Module({
  imports: [ChunkModule, ConfigModule, VectorModule],
  providers: [
    EmbeddingService,
    {
      provide: EMBEDDING_PROVIDER,
      useClass: OpenAiCompatibleEmbeddingProvider,
    },
  ],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
