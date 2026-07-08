import { Injectable } from '@nestjs/common';
import { ObservabilityService } from '../../infrastructure/observability';
import type { RetrievalAccessContext } from '../retrieval';
import { EntityExtractor } from './extractors/entity.extractor';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import type { GraphContext } from './knowledge-graph.types';

@Injectable()
export class GraphRetrievalService {
  constructor(
    private readonly entityExtractor: EntityExtractor,
    private readonly knowledgeGraphRepository: KnowledgeGraphRepository,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<GraphContext[]> {
    const startedAt = Date.now();

    try {
      if (!context.canRetrieve || context.spaceIds.length === 0) {
        this.observabilityService.recordRetrieval({
          context,
          durationMs: Date.now() - startedAt,
          resultCount: 0,
          source: 'graph',
          status: 'success',
        });
        return [];
      }

      const entities = await this.entityExtractor.extract(query);
      const entityNames = entities.map((entity) => entity.name);
      const graphContexts = await this.knowledgeGraphRepository.searchByEntityNames(
        context.spaceIds,
        entityNames,
        limit,
      );

      this.observabilityService.recordRetrieval({
        context,
        durationMs: Date.now() - startedAt,
        resultCount: graphContexts.length,
        source: 'graph',
        status: 'success',
      });

      return graphContexts;
    } catch (error) {
      this.observabilityService.recordRetrieval({
        context,
        durationMs: Date.now() - startedAt,
        error,
        resultCount: 0,
        source: 'graph',
        status: 'failed',
      });
      throw error;
    }
  }
}
