import { Injectable } from '@nestjs/common';
import { GraphClient } from './graph.client';
import type { GraphParameters, GraphQueryResult } from './graph.types';

@Injectable()
export class GraphService {
  constructor(private readonly graphClient: GraphClient) {}

  run(cypher: string, parameters: GraphParameters = {}): Promise<GraphQueryResult[]> {
    return this.graphClient.run(cypher, parameters);
  }
}
