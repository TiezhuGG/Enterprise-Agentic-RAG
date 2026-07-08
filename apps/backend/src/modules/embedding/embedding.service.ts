import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '../../config';
import { ObservabilityService } from '../../infrastructure/observability';
import { VectorService } from '../../infrastructure/vector';
import { ChunkRepository } from '../chunk';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from './providers/embedding.provider';
import type { ProcessEmbeddingResult } from './embedding.types';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
    private readonly vectorService: VectorService,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async processEmbedding(documentId: string): Promise<ProcessEmbeddingResult> {
    const startedAt = Date.now();
    const embeddingConfig = this.configService.getEmbeddingConfig();
    let vectorCount = 0;

    try {
      const chunks = await this.chunkRepository.listByDocumentId(documentId);
      vectorCount = chunks.length;

      if (chunks.length === 0) {
        throw new NotFoundException('Document chunks not found');
      }

      await this.vectorService.deleteByDocumentId(documentId);

      const embeddings = await Promise.all(
        chunks.map(async (chunk) => ({
          chunkId: chunk.id,
          model: embeddingConfig.model,
          dimension: embeddingConfig.dimension,
          vector: await this.embeddingProvider.embed(chunk.content),
        })),
      );

      await this.vectorService.saveChunkEmbeddings(embeddings);

      this.observabilityService.recordEmbedding({
        dimension: embeddingConfig.dimension,
        durationMs: Date.now() - startedAt,
        model: embeddingConfig.model,
        operation: 'processEmbedding',
        status: 'success',
        vectorCount: embeddings.length,
      });

      return {
        documentId,
        model: embeddingConfig.model,
        dimension: embeddingConfig.dimension,
        embeddingCount: embeddings.length,
      };
    } catch (error) {
      this.observabilityService.recordEmbedding({
        dimension: embeddingConfig.dimension,
        durationMs: Date.now() - startedAt,
        error,
        model: embeddingConfig.model,
        operation: 'processEmbedding',
        status: 'failed',
        vectorCount,
      });
      throw error;
    }
  }
}
