import { Injectable } from '@nestjs/common';
import { GraphRetrievalService } from '../../knowledge-graph';
import type { RetrievalAccessContext, RetrieverResult } from '../retrieval.types';

@Injectable()
export class GraphRetriever {
  constructor(private readonly graphRetrievalService: GraphRetrievalService) {}

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<RetrieverResult[]> {
    if (!context.canRetrieve) {
      return [];
    }

    const graphContexts = await this.graphRetrievalService.retrieve(query, context, limit);

    return graphContexts.map((graphContext, index) => ({
      chunkId: `graph:${graphContext.documentId}:${index + 1}`,
      documentId: graphContext.documentId,
      content: graphContext.content,
      score: graphContext.score,
      metadata: {
        documentId: graphContext.documentId,
        graphSource: graphContext.source,
        graphTarget: graphContext.target,
        graphType: graphContext.type,
        sectionTitle: 'Knowledge Graph',
        sequence: index + 1,
      },
      source: 'graph',
    }));
  }
}
