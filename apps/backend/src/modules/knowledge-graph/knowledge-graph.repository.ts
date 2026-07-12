import { Injectable } from '@nestjs/common';
import { GraphService } from '../../infrastructure/graph';
import type {
  GraphContext,
  GraphDocumentCounts,
  GraphEdge,
  GraphEntity,
  GraphEntityCategory,
  GraphNode,
  GraphRelation,
  GraphRelationCategory,
  GraphView,
} from './knowledge-graph.types';

interface GraphContextRow {
  documentId: string;
  sourceId: string;
  source: string;
  spaceId: string;
  sourceType: string;
  targetId: string;
  target: string;
  targetType: string;
  type: string;
}

interface GraphNodeRow {
  category: GraphEntityCategory;
  documentId: string;
  displayType: string;
  id: string;
  name: string;
  spaceId: string;
  type: string;
}

interface GraphEdgeRow {
  displayLabel: string;
  documentId: string;
  evidence: string | null;
  relationCategory: GraphRelationCategory;
  sourceChunkId: string | null;
  sourceId: string;
  targetId: string;
  type: string;
}

const toString = (value: unknown): string => String(value ?? '');
const toNullableString = (value: unknown): string | null => {
  const normalized = toString(value).trim();
  return normalized || null;
};

const normalizeEntityCategory = (value: unknown): GraphEntityCategory => {
  const normalized = toString(value).trim().toUpperCase();
  const categories: GraphEntityCategory[] = [
    'ORGANIZATION',
    'ROLE',
    'POSITION',
    'PROCESS',
    'POLICY',
    'RULE',
    'REQUIREMENT',
    'BENEFIT',
    'DATA',
    'OTHER',
  ];
  if (categories.includes(normalized as GraphEntityCategory)) {
    return normalized as GraphEntityCategory;
  }

  if (/(ORG|DEPARTMENT|TEAM|组织|部门|公司)/i.test(normalized)) return 'ORGANIZATION';
  if (/(POSITION|JOB|岗位|职位|工程师|专员|主管)/i.test(normalized)) return 'POSITION';
  if (/(ROLE|PERSON|USER|角色|人员|负责人)/i.test(normalized)) return 'ROLE';
  if (/(PROCESS|WORKFLOW|流程|阶段|步骤)/i.test(normalized)) return 'PROCESS';
  if (/(BENEFIT|WELFARE|福利|薪资|五险|奖金)/i.test(normalized)) return 'BENEFIT';
  if (/(POLICY|制度|政策|规范|DOCUMENT)/i.test(normalized)) return 'POLICY';
  if (/(RULE|TERM|CLAUSE|规则|条款)/i.test(normalized)) return 'RULE';
  if (/(REQUIREMENT|MATERIAL|要求|材料|条件|资格)/i.test(normalized)) return 'REQUIREMENT';
  if (/(DATA|CODE|AMOUNT|NUMBER|数据|编码|金额)/i.test(normalized)) return 'DATA';
  return 'OTHER';
};

const normalizeRelationCategory = (value: unknown): GraphRelationCategory => {
  const normalized = toString(value).trim().toUpperCase();
  const categories: GraphRelationCategory[] = [
    'OWNERSHIP',
    'CONTAINS',
    'APPROVAL',
    'REFERENCE',
    'REQUIREMENT',
    'APPLIES_TO',
    'PRECEDES',
    'RELATED',
  ];
  if (categories.includes(normalized as GraphRelationCategory)) {
    return normalized as GraphRelationCategory;
  }

  if (/(负责|归属|属于|OWNER|BELONG|MANAGE)/i.test(normalized)) return 'OWNERSHIP';
  if (/(包含|组成|包括|CONTAIN|INCLUDE|PART|HAS_)/i.test(normalized)) return 'CONTAINS';
  if (/(审批|审核|批准|APPROV|REVIEW)/i.test(normalized)) return 'APPROVAL';
  if (/(引用|依据|参考|CITE|REFERENCE|REDIRECT)/i.test(normalized)) return 'REFERENCE';
  if (/(要求|需要|必须|REQUIRE|NEED|MUST)/i.test(normalized)) return 'REQUIREMENT';
  if (/(适用|面向|APPL|TARGET)/i.test(normalized)) return 'APPLIES_TO';
  if (/(之前|之后|先于|PRECEDE|FOLLOW)/i.test(normalized)) return 'PRECEDES';
  return 'RELATED';
};

const entityDisplayTypes: Record<GraphEntityCategory, string> = {
  BENEFIT: '福利',
  DATA: '数据',
  ORGANIZATION: '组织',
  OTHER: '其他',
  POLICY: '制度',
  POSITION: '岗位',
  PROCESS: '流程',
  REQUIREMENT: '要求',
  ROLE: '角色',
  RULE: '规则',
};

const relationDisplayLabels: Record<GraphRelationCategory, string> = {
  APPLIES_TO: '适用于',
  APPROVAL: '审批',
  CONTAINS: '包含',
  OWNERSHIP: '归属 / 负责',
  PRECEDES: '先于',
  REFERENCE: '引用',
  RELATED: '相关',
  REQUIREMENT: '要求',
};

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
  sourceId: toString(row[0]),
  source: toString(row[1]),
  sourceType: toString(row[2]),
  targetId: toString(row[3]),
  target: toString(row[4]),
  targetType: toString(row[5]),
  type: toString(row[6]),
  documentId: toString(row[7]),
  spaceId: toString(row[8]),
});

const toGraphNodeRow = (row: unknown[]): GraphNodeRow => {
  const category = normalizeEntityCategory(row[3] || `${toString(row[2])} ${toString(row[1])}`);

  return {
    id: toString(row[0]),
    name: toString(row[1]),
    type: toString(row[2]),
    category,
    displayType: toString(row[4]) || entityDisplayTypes[category],
    documentId: toString(row[5]),
    spaceId: toString(row[6]),
  };
};

const toGraphEdgeRow = (row: unknown[]): GraphEdgeRow => {
  const relationCategory = normalizeRelationCategory(row[3] || row[2]);

  return {
    sourceId: toString(row[0]),
    targetId: toString(row[1]),
    type: toString(row[2]),
    relationCategory,
    displayLabel: toString(row[4]) || relationDisplayLabels[relationCategory],
    documentId: toString(row[5]),
    sourceChunkId: toNullableString(row[6]),
    evidence: toNullableString(row[7]),
  };
};

const toGraphNode = (row: GraphNodeRow): GraphNode => ({
  category: row.category,
  displayType: row.displayType,
  documentId: row.documentId,
  id: row.id,
  name: row.name,
  spaceId: row.spaceId,
  type: row.type,
});

const toGraphEdge = (row: GraphEdgeRow): GraphEdge => ({
  displayLabel: row.displayLabel,
  documentTitle: null,
  evidence: row.evidence,
  documentId: row.documentId,
  id: `${row.sourceId}:${row.type}:${row.targetId}:${row.documentId}`,
  relationCategory: row.relationCategory,
  sourceChunkId: row.sourceChunkId,
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
            node.category = entity.category,
            node.displayType = entity.displayType,
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
        SET edge.relationCategory = relation.relationCategory,
            edge.displayLabel = relation.displayLabel,
            edge.sourceChunkId = relation.sourceChunkId,
            edge.evidence = relation.evidence
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
      RETURN source.id, source.name, source.type, target.id, target.name, target.type, edge.type, edge.documentId, source.spaceId
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
        path: {
          documentId: row.documentId,
          relation: {
            type: row.type,
          },
          source: {
            id: row.sourceId,
            name: row.source,
            type: row.sourceType,
          },
          spaceId: row.spaceId,
          target: {
            id: row.targetId,
            name: row.target,
            type: row.targetType,
          },
        },
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
        RETURN entity.id, entity.name, entity.type, entity.category, entity.displayType, entity.documentId, entity.spaceId
        ORDER BY entity.name
        `,
        { documentId },
      ),
      this.graphService.run(
        `
        MATCH (source:Entity {documentId: $documentId})-[edge:RELATION {documentId: $documentId}]->(target:Entity {documentId: $documentId})
        RETURN source.id, target.id, edge.type, edge.relationCategory, edge.displayLabel, edge.documentId, edge.sourceChunkId, edge.evidence
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
          OR toLower(coalesce(edge.displayLabel, '')) CONTAINS $query
        )
      RETURN source.id, target.id, edge.type, edge.relationCategory, edge.displayLabel, edge.documentId, edge.sourceChunkId, edge.evidence
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
        RETURN entity.id, entity.name, entity.type, entity.category, entity.displayType, entity.documentId, entity.spaceId
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
      RETURN entity.id, entity.name, entity.type, entity.category, entity.displayType, entity.documentId, entity.spaceId
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
