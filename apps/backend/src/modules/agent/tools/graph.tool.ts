import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../../common';
import { GraphRetrievalService, type GraphContext } from '../../knowledge-graph';
import type { AgentTool } from './tool.types';

export interface GraphToolInput {
  context: ExecutionContext;
  limit: number;
  query: string;
}

@Injectable()
export class GraphTool implements AgentTool<GraphToolInput, GraphContext[]> {
  readonly description = 'Retrieve graph context with space-scoped graph retrieval.';
  readonly name = 'graph' as const;

  constructor(private readonly graphRetrievalService: GraphRetrievalService) {}

  invoke(input: GraphToolInput): Promise<GraphContext[]> {
    return this.retrieve(input.context, input.query, input.limit);
  }

  retrieve(context: ExecutionContext, query: string, limit: number): Promise<GraphContext[]> {
    return this.graphRetrievalService.retrieveForContext(context, query, limit);
  }
}
