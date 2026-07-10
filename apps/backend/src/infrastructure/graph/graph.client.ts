import { Injectable } from '@nestjs/common';
import { createAppServiceUnavailableException } from '../../common';
import { ConfigService } from '../../config';
import type { GraphParameters, GraphQueryResult } from './graph.types';

interface Neo4jHttpResponse {
  errors?: Array<{
    message?: string;
  }>;
  results?: Array<{
    data?: Array<{
      row?: unknown[];
    }>;
  }>;
}

@Injectable()
export class GraphClient {
  private readonly endpoint: string;
  private readonly password: string;
  private readonly username: string;

  constructor(configService: ConfigService) {
    const graphConfig = configService.getGraphConfig();
    const endpointUrl = this.toHttpEndpoint(graphConfig.uri);

    this.endpoint = `${endpointUrl}/db/neo4j/tx/commit`;
    this.username = graphConfig.username;
    this.password = graphConfig.password;
  }

  async run(cypher: string, parameters: GraphParameters = {}): Promise<GraphQueryResult[]> {
    let response: Response;

    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          statements: [
            {
              statement: cypher,
              parameters,
              resultDataContents: ['row'],
            },
          ],
        }),
      });
    } catch {
      throw createAppServiceUnavailableException('GRAPH_UNAVAILABLE');
    }

    if (!response.ok) {
      throw createAppServiceUnavailableException('GRAPH_UNAVAILABLE');
    }

    let payload: Neo4jHttpResponse;

    try {
      payload = (await response.json()) as Neo4jHttpResponse;
    } catch {
      throw createAppServiceUnavailableException('GRAPH_UNAVAILABLE');
    }

    const errorMessage = payload.errors?.find((error) => error.message)?.message;

    if (errorMessage) {
      throw createAppServiceUnavailableException('GRAPH_UNAVAILABLE');
    }

    return (
      payload.results?.[0]?.data?.map((item) => ({
        row: item.row ?? [],
      })) ?? []
    );
  }

  private toHttpEndpoint(uri: string): string {
    const url = new URL(uri);

    if (url.protocol === 'bolt:' || url.protocol === 'neo4j:') {
      url.protocol = 'http:';
      url.port = '7474';
    }

    return url.toString().replace(/\/+$/, '');
  }
}
