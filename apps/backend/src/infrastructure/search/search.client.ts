import { Buffer } from 'node:buffer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config';
import type {
  ElasticsearchBulkResponse,
  ElasticsearchSearchResponse,
  SearchChunkDocument,
  SearchChunkQuery,
  SearchChunkResult,
} from './search.types';

@Injectable()
export class SearchClient {
  private readonly index: string;
  private readonly password: string;
  private readonly url: string;
  private readonly username: string;

  constructor(configService: ConfigService) {
    const searchConfig = configService.getSearchConfig();

    this.index = searchConfig.index;
    this.password = searchConfig.password;
    this.url = searchConfig.url.replace(/\/+$/, '');
    this.username = searchConfig.username;
  }

  async createIndex(): Promise<void> {
    await this.request(`/${this.index}`, {
      body: JSON.stringify({
        mappings: {
          dynamic: false,
          properties: {
            allowedDepartmentIds: { type: 'keyword' },
            chunkId: { type: 'keyword' },
            content: { type: 'text' },
            departmentId: { type: 'keyword' },
            documentId: { type: 'keyword' },
            documentType: { type: 'keyword' },
            language: { type: 'keyword' },
            metadata: { enabled: false, type: 'object' },
            sectionTitle: { type: 'text' },
            securityLevel: { type: 'keyword' },
            sequence: { type: 'integer' },
            spaceId: { type: 'keyword' },
            tokenCount: { type: 'integer' },
            updatedAt: { type: 'date' },
          },
        },
        settings: {
          index: {
            number_of_replicas: 0,
            number_of_shards: 1,
          },
        },
      }),
      headers: this.jsonHeaders(),
      method: 'PUT',
    });
  }

  async deleteAll(): Promise<void> {
    const exists = await this.indexExists();

    if (!exists) {
      return;
    }

    await this.request(`/${this.index}`, {
      method: 'DELETE',
    });
  }

  async deleteByDocumentId(documentId: string): Promise<void> {
    const exists = await this.indexExists();

    if (!exists) {
      return;
    }

    await this.request(`/${this.index}/_delete_by_query?refresh=true&conflicts=proceed`, {
      body: JSON.stringify({
        query: {
          term: {
            documentId,
          },
        },
      }),
      headers: this.jsonHeaders(),
      method: 'POST',
    });
  }

  async healthCheck(): Promise<void> {
    await this.request('/', {
      method: 'GET',
    });
  }

  async indexExists(): Promise<boolean> {
    const response = await fetch(`${this.url}/${this.index}`, {
      headers: this.authHeaders(),
      method: 'HEAD',
    });

    if (response.status === 404) {
      return false;
    }

    if (!response.ok) {
      throw new Error(`Elasticsearch index check failed with status ${response.status}`);
    }

    return true;
  }

  async bulkIndex(documents: SearchChunkDocument[]): Promise<void> {
    if (documents.length === 0) {
      return;
    }

    const payload = documents
      .flatMap((document) => [
        JSON.stringify({
          index: {
            _id: document.chunkId,
            _index: this.index,
          },
        }),
        JSON.stringify(document),
      ])
      .join('\n');

    const response = await this.request<ElasticsearchBulkResponse>('/_bulk?refresh=true', {
      body: `${payload}\n`,
      headers: {
        ...this.authHeaders(),
        'content-type': 'application/x-ndjson',
      },
      method: 'POST',
    });

    if (response.errors) {
      const failedItem = response.items?.find((item) =>
        Object.values(item).some((operation) => operation.error),
      );

      throw new Error(
        `Elasticsearch bulk index failed${failedItem ? `: ${JSON.stringify(failedItem)}` : ''}`,
      );
    }
  }

  async searchChunks(input: SearchChunkQuery): Promise<SearchChunkResult[]> {
    const response = await this.request<ElasticsearchSearchResponse<SearchChunkDocument>>(
      `/${this.index}/_search`,
      {
        body: JSON.stringify({
          query: {
            bool: {
              filter: [
                {
                  terms: {
                    spaceId: input.spaceIds,
                  },
                },
              ],
              must: [
                {
                  multi_match: {
                    fields: ['content^3', 'sectionTitle^2'],
                    operator: 'or',
                    query: input.query,
                    type: 'best_fields',
                  },
                },
              ],
            },
          },
          size: input.limit,
          sort: [{ _score: 'desc' }, { sequence: 'asc' }],
          track_total_hits: false,
        }),
        headers: this.jsonHeaders(),
        method: 'POST',
      },
    );

    return (response.hits?.hits ?? [])
      .filter((hit): hit is ElasticsearchHitWithSource => Boolean(hit._source))
      .map((hit) => ({
        chunkId: hit._source.chunkId,
        content: hit._source.content,
        documentId: hit._source.documentId,
        metadata: hit._source.metadata,
        score: hit._score ?? 0,
      }));
  }

  private authHeaders(): Record<string, string> {
    if (!this.username || !this.password) {
      return {};
    }

    return {
      authorization: `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
    };
  }

  private jsonHeaders(): Record<string, string> {
    return {
      ...this.authHeaders(),
      'content-type': 'application/json',
    };
  }

  private async request<TResponse = unknown>(path: string, init: RequestInit): Promise<TResponse> {
    const response = await fetch(`${this.url}${path}`, {
      ...init,
      headers: {
        ...this.authHeaders(),
        ...this.normalizeHeaders(init.headers),
      },
    });

    if (!response.ok) {
      const message = await this.safeResponseText(response);

      throw new Error(
        `Elasticsearch request failed with status ${response.status}${message ? `: ${message}` : ''}`,
      );
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    const text = await response.text();

    if (!text) {
      return undefined as TResponse;
    }

    return JSON.parse(text) as TResponse;
  }

  private async safeResponseText(response: Response): Promise<string> {
    try {
      return (await response.text()).slice(0, 240);
    } catch {
      return '';
    }
  }

  private normalizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) {
      return {};
    }

    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }

    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }

    return headers;
  }
}

type ElasticsearchHitWithSource = {
  _id: string;
  _score?: number;
  _source: SearchChunkDocument;
};
