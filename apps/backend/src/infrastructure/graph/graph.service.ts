import { Injectable } from '@nestjs/common';
import { GraphClient } from './graph.client';
import type { GraphParameters, GraphQueryResult } from './graph.types';

@Injectable()
export class GraphService {
  constructor(private readonly graphClient: GraphClient) {}

  run(cypher: string, parameters: GraphParameters = {}): Promise<GraphQueryResult[]> {
    return this.graphClient.run(cypher, parameters);
  }

  async healthCheck(): Promise<void> {
    await this.graphClient.run('RETURN 1 AS ok');
  }
}
