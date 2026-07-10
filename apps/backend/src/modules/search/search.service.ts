import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { DocumentRepository, type DocumentEntity } from '../document';
import { RetrievalService, type ContextChunk, type RetrievalMode } from '../retrieval';
import type {
  SearchDocumentSource,
  SearchMode,
  SearchRequest,
  SearchResponse,
  SearchResultItem,
  SearchSort,
} from './search.types';

const defaultSearchLimit = 10;
const maxSearchContextTokens = 100_000;

@Injectable()
export class SearchApiService {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly retrievalService: RetrievalService,
  ) {}

  searchFulltext(context: ExecutionContext, request: SearchRequest): Promise<SearchResponse> {
    return this.search(context, request, 'fulltext', 'keyword');
  }

  searchSemantic(context: ExecutionContext, request: SearchRequest): Promise<SearchResponse> {
    return this.search(context, request, 'semantic', 'vector');
  }

  searchHybrid(context: ExecutionContext, request: SearchRequest): Promise<SearchResponse> {
    return this.search(context, request, 'hybrid', 'hybrid');
  }

  private async search(
    context: ExecutionContext,
    request: SearchRequest,
    mode: SearchMode,
    retrievalMode: RetrievalMode,
  ): Promise<SearchResponse> {
    const limit = request.limit ?? defaultSearchLimit;
    const offset = request.offset ?? 0;
    const sort = request.sort ?? 'relevance';
    const candidateLimit = limit + offset;
    const scopedContext = this.createScopedContext(context, request.spaceId);
    const retrieval = await this.retrievalService.retrieveWithBreakdown(scopedContext, {
      enableGraph: mode === 'hybrid',
      keywordLimit: candidateLimit,
      limit: candidateLimit,
      maxContextTokens: maxSearchContextTokens,
      mode: retrievalMode,
      query: request.query,
      vectorLimit: candidateLimit,
    });
    const chunks = this.filterByDocumentType(retrieval.chunks, request.documentType);
    const documentsById = await this.loadDocumentsById(chunks);
    const sortedResults = this.sortResults(this.toResults(chunks, documentsById), sort);
    const total = sortedResults.length;

    return {
      breakdown: retrieval.breakdown,
      limit,
      mode,
      offset,
      query: request.query,
      results: sortedResults.slice(offset, offset + limit),
      sort,
      total,
    };
  }

  private createScopedContext(context: ExecutionContext, spaceId?: string): ExecutionContext {
    return spaceId
      ? {
          ...context,
          spaceIds: [spaceId],
        }
      : context;
  }

  private filterByDocumentType(chunks: ContextChunk[], documentType?: string): ContextChunk[] {
    if (!documentType) {
      return chunks;
    }

    return chunks.filter((chunk) => chunk.metadata.documentType === documentType);
  }

  private async loadDocumentsById(
    chunks: ContextChunk[],
  ): Promise<Map<string, SearchDocumentSource>> {
    const documents = await this.documentRepository.findActiveByIds(
      chunks.map((chunk) => chunk.documentId),
    );

    return new Map(documents.map((document) => [document.id, this.toDocumentSource(document)]));
  }

  private toResults(
    chunks: ContextChunk[],
    documentsById: Map<string, SearchDocumentSource>,
  ): SearchResultItem[] {
    return chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      content: chunk.content,
      document: documentsById.get(chunk.documentId) ?? null,
      documentId: chunk.documentId,
      metadata: chunk.metadata as unknown as Record<string, unknown>,
      score: chunk.score,
    }));
  }

  private sortResults(results: SearchResultItem[], sort: SearchSort): SearchResultItem[] {
    if (sort === 'updatedAt') {
      return [...results].sort((left, right) => {
        const updatedAtDelta =
          new Date(right.document?.updatedAt ?? 0).getTime() -
          new Date(left.document?.updatedAt ?? 0).getTime();

        return updatedAtDelta === 0 ? right.score - left.score : updatedAtDelta;
      });
    }

    return [...results].sort((left, right) => right.score - left.score);
  }

  private toDocumentSource(document: DocumentEntity): SearchDocumentSource {
    return {
      id: document.id,
      spaceId: document.spaceId,
      status: document.status,
      title: document.title,
      type: document.type,
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
