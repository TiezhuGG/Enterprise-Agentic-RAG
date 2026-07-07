import { Injectable } from '@nestjs/common';
import { GraphService } from '../../infrastructure/graph';
import type { GraphContext, GraphEntity, GraphRelation } from './knowledge-graph.types';

interface GraphContextRow {
  documentId: string;
  source: string;
  sourceType: string;
  target: string;
  targetType: string;
  type: string;
}

const toString = (value: unknown): string => String(value ?? '');

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
}
