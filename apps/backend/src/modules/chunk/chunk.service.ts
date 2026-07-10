import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SearchService, type SearchChunkDocument } from '../../infrastructure/search';
import type { DocumentContentMetadata } from '../document';
import { ChunkRepository } from './chunk.repository';
import { type ChunkEntity, type ChunkMetadata } from './chunk.entity';
import { defaultChunkOverlapTokens, defaultChunkSizeTokens } from './chunk.types';
import { MarkdownHeaderSplitter } from './splitters/markdown-header.splitter';
import { TokenSplitter } from './splitters/token.splitter';

@Injectable()
export class ChunkService {
  private readonly logger = new Logger(ChunkService.name);

  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly markdownHeaderSplitter: MarkdownHeaderSplitter,
    private readonly searchService: SearchService,
    private readonly tokenSplitter: TokenSplitter,
  ) {}

  async processChunks(documentId: string): Promise<ChunkEntity[]> {
    const documentContent = await this.chunkRepository.findDocumentContentByDocumentId(documentId);

    if (!documentContent) {
      throw new NotFoundException('Document content not found');
    }

    await this.chunkRepository.deleteByDocumentId(documentId);

    const sections = this.markdownHeaderSplitter.split(documentContent.content);
    const splitChunks = this.tokenSplitter.splitSections(sections, {
      chunkSize: defaultChunkSizeTokens,
      overlap: defaultChunkOverlapTokens,
    });

    const chunks = splitChunks.map((chunk, index) => ({
      documentId,
      content: chunk.content,
      sequence: index + 1,
      tokenCount: this.tokenSplitter.countTokens(chunk.content),
      metadata: this.createChunkMetadata(documentContent.metadata, index + 1, chunk.sectionTitle),
    }));

    const createdChunks = await this.chunkRepository.createMany(chunks);

    await this.syncSearchIndexSafely(
      documentId,
      createdChunks.map((chunk) => ({
        allowedDepartmentIds: chunk.metadata.allowedDepartmentIds,
        chunkId: chunk.id,
        content: chunk.content,
        departmentId: chunk.metadata.departmentId,
        documentId: chunk.documentId,
        documentType: chunk.metadata.documentType,
        language: chunk.metadata.language,
        metadata: chunk.metadata,
        sectionTitle: chunk.metadata.sectionTitle,
        securityLevel: chunk.metadata.securityLevel,
        sequence: chunk.sequence,
        spaceId: chunk.metadata.spaceId,
        tokenCount: chunk.tokenCount,
        updatedAt: chunk.updatedAt.toISOString(),
      })) satisfies SearchChunkDocument[],
    );

    return createdChunks;
  }

  private async syncSearchIndexSafely(
    documentId: string,
    chunks: SearchChunkDocument[],
  ): Promise<void> {
    try {
      await this.searchService.deleteDocumentChunks(documentId);
      await this.searchService.indexChunks(chunks);
    } catch (error) {
      this.logger.warn(
        `Search index sync failed for document ${documentId}; ingestion will continue. ${this.toErrorMessage(
          error,
        )}`,
      );
    }
  }

  private createChunkMetadata(
    documentMetadata: DocumentContentMetadata,
    sequence: number,
    sectionTitle: string,
  ): ChunkMetadata {
    const metadata: ChunkMetadata = {
      documentId: documentMetadata.documentId,
      sequence,
      sectionTitle,
      spaceId: documentMetadata.spaceId,
      documentType: documentMetadata.documentType,
      language: documentMetadata.language,
      securityLevel: documentMetadata.securityLevel,
      sourceHash: documentMetadata.sourceHash,
      contentHash: documentMetadata.contentHash,
    };

    if (documentMetadata.departmentId) {
      metadata.departmentId = documentMetadata.departmentId;
    }

    if (documentMetadata.allowedDepartmentIds?.length) {
      metadata.allowedDepartmentIds = documentMetadata.allowedDepartmentIds;
    }

    return metadata;
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
