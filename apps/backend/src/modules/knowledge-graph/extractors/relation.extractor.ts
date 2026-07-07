import { Inject, Injectable } from '@nestjs/common';
import type { ExtractedEntity, ExtractedRelation, GraphProvider } from '../knowledge-graph.types';
import { GRAPH_PROVIDER } from '../providers/llm-graph.provider';

@Injectable()
export class RelationExtractor {
  constructor(
    @Inject(GRAPH_PROVIDER)
    private readonly graphProvider: GraphProvider,
  ) {}

  extract(content: string, entities: ExtractedEntity[]): Promise<ExtractedRelation[]> {
    return this.graphProvider.extractRelations(content, entities);
  }
}
