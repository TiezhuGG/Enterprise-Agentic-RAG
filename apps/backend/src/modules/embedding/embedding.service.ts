import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '../../config';
import { VectorService } from '../../infrastructure/vector';
import { ChunkRepository } from '../chunk';
import { EMBEDDING_PROVIDER, type EmbeddingProvider } from './providers/embedding.provider';
import type { ProcessEmbeddingResult } from './embedding.types';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly configService: ConfigService,
    private readonly vectorService: VectorService,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
  ) {}

  async processEmbedding(documentId: string): Promise<ProcessEmbeddingResult> {
    const chunks = await this.chunkRepository.listByDocumentId(documentId);

    if (chunks.length === 0) {
      throw new NotFoundException('Document chunks not found');
    }

    const embeddingConfig = this.configService.getEmbeddingConfig();

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

    return {
      documentId,
      model: embeddingConfig.model,
      dimension: embeddingConfig.dimension,
      embeddingCount: embeddings.length,
    };
  }
}
