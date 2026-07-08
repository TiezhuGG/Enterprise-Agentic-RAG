import { Injectable } from '@nestjs/common';
import { GraphService } from '../../infrastructure/graph';
import type {
  GraphContext,
  GraphDocumentCounts,
  GraphEntity,
  GraphRelation,
} from './knowledge-graph.types';

interface GraphContextRow {
  documentId: string;
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
  type: string;
}

const toString = (value: unknown): string => String(value ?? '');

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'object' && value !== null) {
    const candidate = value as { high?: unknown; low?: unknown };
    const low = Number(candidate.low ?? 0);
    const high = Number(candidate.high ?? 0);

    if (Number.isFinite(low) && Number.isFinite(high)) {
      return high * 2 ** 32 + low;
    }
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
};

const toGraphContextRow = (row: unknown[]): GraphContextRow => ({
  source: toString(row[0]),
  sourceType: toString(row[1]),
  target: toString(row[2]),
  targetType: toString(row[3]),
  type: toString(row[4]),
  documentId: toString(row[5]),
});

@Injectable()
export class KnowledgeGraphRepository {
  constructor(private readonly graphService: GraphService) {}

  async saveDocumentGraph(
    documentId: string,
    entities: GraphEntity[],
    relations: GraphRelation[],
  ): Promise<void> {
    await this.graphService.run(
      `
      MATCH (entity:Entity {documentId: $documentId})
      DETACH DELETE entity
      `,
      { documentId },
    );

    if (entities.length > 0) {
      await this.graphService.run(
        `
        UNWIND $entities AS entity
        MERGE (node:Entity {id: entity.id})
        SET node.name = entity.name,
            node.type = entity.type,
            node.spaceId = entity.spaceId,
            node.documentId = entity.documentId
        `,
        {
          entities,
        },
      );
    }

    if (relations.length > 0) {
      await this.graphService.run(
        `
        UNWIND $relations AS relation
        MATCH (source:Entity {id: relation.sourceId})
        MATCH (target:Entity {id: relation.targetId})
        MERGE (source)-[edge:RELATION {
          type: relation.type,
          source: relation.source,
          target: relation.target,
          documentId: relation.documentId
        }]->(target)
        `,
        {
          relations,
        },
      );
    }
  }

  async searchByEntityNames(
    spaceIds: string[],
    entityNames: string[],
    limit: number,
  ): Promise<GraphContext[]> {
    if (spaceIds.length === 0 || entityNames.length === 0) {
      return [];
    }

    const rows = await this.graphService.run(
      `
      MATCH (source:Entity)-[edge:RELATION]-(target:Entity)
      WHERE source.spaceId IN $spaceIds
        AND toLower(source.name) IN $entityNames
      RETURN source.name, source.type, target.name, target.type, edge.type, edge.documentId
      LIMIT $limit
      `,
      {
        entityNames: entityNames.map((name) => name.toLowerCase()),
        limit,
        spaceIds,
      },
    );

    return rows.map((result, index) => {
      const row = toGraphContextRow(result.row);

      return {
        content: `${row.source}(${row.sourceType}) -[${row.type}]- ${row.target}(${row.targetType})`,
        documentId: row.documentId,
        score: 1 / (index + 1),
        source: row.source,
        target: row.target,
        type: row.type,
      };
    });
  }

  async countDocumentGraph(documentId: string): Promise<GraphDocumentCounts> {
    const rows = await this.graphService.run(
      `
      OPTIONAL MATCH (entity:Entity {documentId: $documentId})
      WITH count(DISTINCT entity) AS entityCount
      OPTIONAL MATCH (:Entity {documentId: $documentId})-[relation:RELATION {documentId: $documentId}]->(:Entity {documentId: $documentId})
      RETURN entityCount, count(DISTINCT relation)
      `,
      {
        documentId,
      },
    );
    const row = rows[0]?.row ?? [];

    return {
      documentId,
      entityCount: toNumber(row[0]),
      relationCount: toNumber(row[1]),
    };
  }
}
