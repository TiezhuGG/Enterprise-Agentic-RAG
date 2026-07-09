import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';
import { ObservabilityService } from '../observability';
import { PrismaService } from '../prisma';
import { SearchClient } from './search.client';
import type {
  SearchChunkDocument,
  SearchChunkQuery,
  SearchChunkResult,
  SearchReindexResult,
} from './search.types';

interface ChunkModel {
  id: string;
  content: string;
  documentId: string;
  metadata: unknown;
  sequence: number;
  tokenCount: number;
  updatedAt: Date;
  document: {
    spaceId: string;
    status: string;
  };
}

interface ChunkMetadataShape {
  allowedDepartmentIds?: unknown;
  departmentId?: unknown;
  documentType?: unknown;
  language?: unknown;
  sectionTitle?: unknown;
  securityLevel?: unknown;
}

@Injectable()
export class SearchService {
  private readonly index: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly observabilityService: ObservabilityService,
    private readonly prisma: PrismaService,
    private readonly searchClient: SearchClient,
  ) {
    this.index = this.configService.getSearchConfig().index;
  }

  async deleteDocumentChunks(documentId: string): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.searchClient.deleteByDocumentId(documentId);
      this.recordOperation('delete-document-chunks', startedAt, 'success', 0);
    } catch (error) {
      this.recordOperation('delete-document-chunks', startedAt, 'failed', 0, error);
      throw error;
    }
  }

  async ensureIndex(): Promise<void> {
    const startedAt = Date.now();

    try {
      const exists = await this.searchClient.indexExists();

      if (!exists) {
        await this.searchClient.createIndex();
      }

      this.recordOperation('ensure-index', startedAt, 'success');
    } catch (error) {
      this.recordOperation('ensure-index', startedAt, 'failed', undefined, error);
      throw error;
    }
  }

  async healthCheck(): Promise<void> {
    await this.searchClient.healthCheck();
  }

  async indexChunks(chunks: SearchChunkDocument[]): Promise<void> {
    if (chunks.length === 0) {
      return;
    }

    const startedAt = Date.now();

    try {
      await this.ensureIndex();
      await this.searchClient.bulkIndex(chunks);
      this.recordOperation('index-chunks', startedAt, 'success', chunks.length);
    } catch (error) {
      this.recordOperation('index-chunks', startedAt, 'failed', chunks.length, error);
      throw error;
    }
  }

  async reindexAll(): Promise<SearchReindexResult> {
    const startedAt = Date.now();

    try {
      const chunks = await this.listReadyChunksForSearch();

      await this.searchClient.deleteAll();
      await this.ensureIndex();
      await this.searchClient.bulkIndex(chunks);

      this.recordOperation('reindex-all', startedAt, 'success', chunks.length);

      return {
        indexedCount: chunks.length,
        index: this.index,
        sourceCount: chunks.length,
      };
    } catch (error) {
      this.recordOperation('reindex-all', startedAt, 'failed', undefined, error);
      throw error;
    }
  }

  async searchChunks(input: SearchChunkQuery): Promise<SearchChunkResult[]> {
    if (input.spaceIds.length === 0 || !input.query.trim()) {
      return [];
    }

    const startedAt = Date.now();

    try {
      await this.ensureIndex();
      const results = await this.searchClient.searchChunks(input);

      this.recordOperation('search-chunks', startedAt, 'success', results.length);

      return results;
    } catch (error) {
      this.recordOperation('search-chunks', startedAt, 'failed', undefined, error);
      throw error;
    }
  }

  private async listReadyChunksForSearch(): Promise<SearchChunkDocument[]> {
    const chunks = await this.prisma.chunk.findMany({
      include: {
        document: {
          select: {
            spaceId: true,
            status: true,
          },
        },
      },
      orderBy: [
        {
          documentId: 'asc',
        },
        {
          sequence: 'asc',
        },
      ],
      where: {
        document: {
          status: 'READY',
        },
      },
    });

    return chunks.map((chunk) => this.toSearchChunkDocument(chunk));
  }

  private recordOperation(
    operation: string,
    startedAt: number,
    status: 'success' | 'failed',
    recordCount?: number,
    error?: unknown,
  ): void {
    this.observabilityService.recordSearch({
      durationMs: Date.now() - startedAt,
      error,
      operation,
      recordCount,
      status,
    });
  }

  private toSearchChunkDocument(chunk: ChunkModel): SearchChunkDocument {
    const metadata = this.toMetadata(chunk.metadata);
    const shapedMetadata = metadata as ChunkMetadataShape;

    return {
      allowedDepartmentIds: this.toStringArray(shapedMetadata.allowedDepartmentIds),
      chunkId: chunk.id,
      content: chunk.content,
      departmentId: this.toOptionalString(shapedMetadata.departmentId),
      documentId: chunk.documentId,
      documentType: this.toString(shapedMetadata.documentType, 'UNKNOWN'),
      language: this.toString(shapedMetadata.language, 'unknown'),
      metadata,
      sectionTitle: this.toString(shapedMetadata.sectionTitle, ''),
      securityLevel: this.toString(shapedMetadata.securityLevel, 'INTERNAL'),
      sequence: chunk.sequence,
      spaceId: chunk.document.spaceId,
      tokenCount: chunk.tokenCount,
      updatedAt: chunk.updatedAt.toISOString(),
    };
  }

  private toMetadata(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }

  private toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue || undefined;
  }

  private toString(value: unknown, fallback: string): string {
    return this.toOptionalString(value) ?? fallback;
  }

  private toStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }

    const normalizedValue = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);

    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }
}
