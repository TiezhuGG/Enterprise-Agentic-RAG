import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../../common';
import { GraphRetrievalService, type GraphContext } from '../../knowledge-graph';
import { ContextBuilder } from '../../retrieval';

@Injectable()
export class GraphTool {
  constructor(
    private readonly contextBuilder: ContextBuilder,
    private readonly graphRetrievalService: GraphRetrievalService,
  ) {}

  retrieve(context: ExecutionContext, query: string, limit: number): Promise<GraphContext[]> {
    const accessContext = this.contextBuilder.build(context);

    return this.graphRetrievalService.retrieve(query, accessContext, limit);
  }
}
