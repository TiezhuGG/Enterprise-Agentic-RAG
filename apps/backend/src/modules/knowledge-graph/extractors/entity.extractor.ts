import { Inject, Injectable } from '@nestjs/common';
import type { ExtractedEntity, GraphProvider } from '../knowledge-graph.types';
import { GRAPH_PROVIDER } from '../providers/llm-graph.provider';

@Injectable()
export class EntityExtractor {
  constructor(
    @Inject(GRAPH_PROVIDER)
    private readonly graphProvider: GraphProvider,
  ) {}

  extract(content: string): Promise<ExtractedEntity[]> {
    return this.graphProvider.extractEntities(content);
  }
}
