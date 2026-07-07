import { Injectable } from '@nestjs/common';
import type { RetrievalAccessContext } from '../retrieval';
import { EntityExtractor } from './extractors/entity.extractor';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import type { GraphContext } from './knowledge-graph.types';

@Injectable()
export class GraphRetrievalService {
  constructor(
    private readonly entityExtractor: EntityExtractor,
    private readonly knowledgeGraphRepository: KnowledgeGraphRepository,
  ) {}

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<GraphContext[]> {
    if (!context.canRetrieve || context.spaceIds.length === 0) {
      return [];
    }

    const entities = await this.entityExtractor.extract(query);
    const entityNames = entities.map((entity) => entity.name);

    return this.knowledgeGraphRepository.searchByEntityNames(context.spaceIds, entityNames, limit);
  }
}
