import { Injectable } from '@nestjs/common';
import { GraphService } from '../../infrastructure/graph';
import type {
  GraphContext,
  GraphDocumentCounts,
  GraphEdge,
  GraphEntity,
  GraphNode,
  GraphRelation,
  GraphView,
} from './knowledge-graph.types';

interface GraphContextRow {
  documentId: string;
  source: string;
  spaceId: string;
  sourceType: string;
  target: string;
  targetType: string;
  type: string;
}

interface GraphNodeRow {
  documentId: string;
  id: string;
  name: string;
  spaceId: string;
  type: string;
}

interface GraphEdgeRow {
  documentId: string;
  sourceId: string;
  targetId: string;
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
  spaceId: toString(row[6]),
});

const toGraphNodeRow = (row: unknown[]): GraphNodeRow => ({
  id: toString(row[0]),
  name: toString(row[1]),
  type: toString(row[2]),
  documentId: toString(row[3]),
  spaceId: toString(row[4]),
});

const toGraphEdgeRow = (row: unknown[]): GraphEdgeRow => ({
  sourceId: toString(row[0]),
  targetId: toString(row[1]),
  type: toString(row[2]),
  documentId: toString(row[3]),
});

const toGraphNode = (row: GraphNodeRow): GraphNode => ({
  documentId: row.documentId,
  id: row.id,
  name: row.name,
  spaceId: row.spaceId,
  type: row.type,
});

const toGraphEdge = (row: GraphEdgeRow): GraphEdge => ({
  documentId: row.documentId,
  id: `${row.sourceId}:${row.type}:${row.targetId}:${row.documentId}`,
  sourceId: row.sourceId,
  targetId: row.targetId,
  type: row.type,
});

const toGraphView = (
  source: GraphView['source'],
  nodes: GraphNode[],
  edges: GraphEdge[],
): GraphView => ({
  counts: {
    edges: edges.length,
    nodes: nodes.length,
  },
  edges,
  generatedAt: new Date().toISOString(),
  nodes,
  source,
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
      RETURN source.name, source.type, target.name, target.type, edge.type, edge.documentId, source.spaceId
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
        spaceId: row.spaceId,
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

  async getDocumentGraph(documentId: string): Promise<GraphView> {
    const [nodeRows, edgeRows] = await Promise.all([
      this.graphService.run(
        `
        MATCH (entity:Entity {documentId: $documentId})
        RETURN entity.id, entity.name, entity.type, entity.documentId, entity.spaceId
        ORDER BY entity.name
        `,
        { documentId },
      ),
      this.graphService.run(
        `
        MATCH (source:Entity {documentId: $documentId})-[edge:RELATION {documentId: $documentId}]->(target:Entity {documentId: $documentId})
        RETURN source.id, target.id, edge.type, edge.documentId
        ORDER BY source.name, target.name
        `,
        { documentId },
      ),
    ]);

    return toGraphView(
      'document',
      nodeRows.map((result) => toGraphNode(toGraphNodeRow(result.row))),
      edgeRows.map((result) => toGraphEdge(toGraphEdgeRow(result.row))),
    );
  }

  async getSpaceGraph(input: {
    documentIds: string[];
    limit: number;
    query?: string;
    spaceId: string;
  }): Promise<GraphView> {
    if (input.documentIds.length === 0) {
      return toGraphView('space', [], []);
    }

    const query = input.query?.trim().toLowerCase() ?? '';
    const relationRows = await this.graphService.run(
      `
      MATCH (source:Entity)-[edge:RELATION]->(target:Entity)
      WHERE source.spaceId = $spaceId
        AND edge.documentId IN $documentIds
        AND (
          $query = ''
          OR toLower(source.name) CONTAINS $query
          OR toLower(target.name) CONTAINS $query
          OR toLower(edge.type) CONTAINS $query
        )
      RETURN source.id, target.id, edge.type, edge.documentId
      LIMIT $limit
      `,
      {
        documentIds: input.documentIds,
        limit: input.limit,
        query,
        spaceId: input.spaceId,
      },
    );
    const edges = relationRows.map((result) => toGraphEdge(toGraphEdgeRow(result.row)));
    const nodeIds = [...new Set(edges.flatMap((edge) => [edge.sourceId, edge.targetId]))];

    if (nodeIds.length === 0) {
      const nodeRows = await this.graphService.run(
        `
        MATCH (entity:Entity {spaceId: $spaceId})
        WHERE entity.documentId IN $documentIds
          AND ($query = '' OR toLower(entity.name) CONTAINS $query)
        RETURN entity.id, entity.name, entity.type, entity.documentId, entity.spaceId
        ORDER BY entity.name
        LIMIT $limit
        `,
        {
          documentIds: input.documentIds,
          limit: input.limit,
          query,
          spaceId: input.spaceId,
        },
      );

      return toGraphView(
        'space',
        nodeRows.map((result) => toGraphNode(toGraphNodeRow(result.row))),
        [],
      );
    }

    const nodeRows = await this.graphService.run(
      `
      MATCH (entity:Entity)
      WHERE entity.id IN $nodeIds
      RETURN entity.id, entity.name, entity.type, entity.documentId, entity.spaceId
      ORDER BY entity.name
      `,
      { nodeIds },
    );

    return toGraphView(
      'space',
      nodeRows.map((result) => toGraphNode(toGraphNodeRow(result.row))),
      edges,
    );
  }
}
