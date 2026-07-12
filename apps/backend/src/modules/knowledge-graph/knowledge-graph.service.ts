import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { ExecutionContext } from '../../common';
import { ChunkRepository } from '../chunk';
import { DocumentRepository, DocumentService } from '../document';
import { KnowledgeSpaceService } from '../knowledge-space';
import { EntityExtractor } from './extractors/entity.extractor';
import { RelationExtractor } from './extractors/relation.extractor';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import type {
  ExtractedEntity,
  GraphDocumentCounts,
  GraphEntity,
  GraphEntityCategory,
  GraphExtractionResult,
  GraphRelationCategory,
  GraphView,
  GraphRelation,
} from './knowledge-graph.types';

const normalizeName = (name: string): string => name.trim().toLowerCase();
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

@Injectable()
export class KnowledgeGraphService {
  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly documentService: DocumentService,
    private readonly entityExtractor: EntityExtractor,
    private readonly knowledgeSpaceService: KnowledgeSpaceService,
    private readonly knowledgeGraphRepository: KnowledgeGraphRepository,
    private readonly relationExtractor: RelationExtractor,
  ) {}

  async extractDocumentGraph(documentId: string): Promise<GraphExtractionResult> {
    const document = await this.documentRepository.findActiveById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const chunks = await this.chunkRepository.listByDocumentId(document.id);

    if (chunks.length === 0) {
      throw new NotFoundException('Document chunks not found');
    }

    const entityByKey = new Map<string, GraphEntity>();
    const relations: GraphRelation[] = [];

    for (const chunk of chunks) {
      const extractedEntities = await this.entityExtractor.extract(chunk.content);
      const chunkEntities = this.toGraphEntities(document.spaceId, document.id, extractedEntities);

      for (const entity of chunkEntities) {
        entityByKey.set(this.entityKey(entity.name), entity);
      }

      const extractedRelations = await this.relationExtractor.extract(
        chunk.content,
        extractedEntities,
      );

      for (const relation of extractedRelations) {
        const source = this.ensureEntity(
          entityByKey,
          document.spaceId,
          document.id,
          relation.subject,
        );
        const target = this.ensureEntity(
          entityByKey,
          document.spaceId,
          document.id,
          relation.object,
        );

        relations.push({
          displayLabel: relationDisplayLabels[relation.relationCategory ?? 'RELATED'],
          documentId: document.id,
          evidence: relation.evidence || chunk.content.slice(0, 240),
          relationCategory: relation.relationCategory ?? 'RELATED',
          source: source.name,
          sourceChunkId: chunk.id,
          sourceId: source.id,
          target: target.name,
          targetId: target.id,
          type: relation.predicate,
        });
      }
    }

    const entities = [...entityByKey.values()];

    await this.knowledgeGraphRepository.saveDocumentGraph(document.id, entities, relations);

    return {
      chunkCount: chunks.length,
      documentId: document.id,
      entityCount: entities.length,
      entityTypeDistribution: this.countEntityTypes(entities),
      relationCount: relations.length,
    };
  }

  async getDocumentGraphCounts(documentId: string): Promise<GraphDocumentCounts> {
    const document = await this.documentRepository.findActiveById(documentId);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.knowledgeGraphRepository.countDocumentGraph(document.id);
  }

  async getDocumentGraph(context: ExecutionContext, documentId: string): Promise<GraphView> {
    const document = await this.documentService.getById(context, documentId);
    const view = await this.knowledgeGraphRepository.getDocumentGraph(document.id);

    return this.withDocumentTitles(view, new Map([[document.id, document.title]]));
  }

  async getSpaceGraph(
    context: ExecutionContext,
    spaceId: string,
    input: { limit?: number; query?: string },
  ): Promise<GraphView> {
    await this.knowledgeSpaceService.getById(context, spaceId);
    const documents = await this.documentService.listBySpace(context, spaceId);

    const view = await this.knowledgeGraphRepository.getSpaceGraph({
      documentIds: documents.map((document) => document.id),
      limit: this.normalizeLimit(input.limit),
      query: input.query,
      spaceId,
    });

    return this.withDocumentTitles(
      view,
      new Map(documents.map((document) => [document.id, document.title])),
    );
  }

  private createEntityId(spaceId: string, documentId: string, name: string): string {
    const digest = createHash('sha1')
      .update(`${spaceId}:${documentId}:${normalizeName(name)}`)
      .digest('hex');

    return `entity:${digest}`;
  }

  private ensureEntity(
    entityByKey: Map<string, GraphEntity>,
    spaceId: string,
    documentId: string,
    name: string,
  ): GraphEntity {
    const key = this.entityKey(name);
    const existingEntity = entityByKey.get(key);

    if (existingEntity) {
      return existingEntity;
    }

    const entity = {
      category: 'OTHER' as const,
      displayType: entityDisplayTypes.OTHER,
      id: this.createEntityId(spaceId, documentId, name),
      name,
      type: 'UNKNOWN',
      spaceId,
      documentId,
    };

    entityByKey.set(key, entity);

    return entity;
  }

  private entityKey(name: string): string {
    return normalizeName(name);
  }

  private normalizeLimit(limit: number | undefined): number {
    if (!limit || !Number.isFinite(limit)) {
      return 80;
    }

    return Math.max(1, Math.min(200, Math.floor(limit)));
  }

  private toGraphEntities(
    spaceId: string,
    documentId: string,
    entities: ExtractedEntity[],
  ): GraphEntity[] {
    return entities.map((entity) => ({
      category: entity.category ?? 'OTHER',
      displayType: entityDisplayTypes[entity.category ?? 'OTHER'],
      id: this.createEntityId(spaceId, documentId, entity.name),
      name: entity.name,
      type: entity.type,
      spaceId,
      documentId,
    }));
  }

  private withDocumentTitles(view: GraphView, titles: Map<string, string>): GraphView {
    return {
      ...view,
      edges: view.edges.map((edge) => ({
        ...edge,
        documentTitle: titles.get(edge.documentId) ?? null,
      })),
    };
  }

  private countEntityTypes(entities: GraphEntity[]): Record<string, number> {
    return entities.reduce<Record<string, number>>((distribution, entity) => {
      const type = entity.displayType;

      distribution[type] = (distribution[type] ?? 0) + 1;

      return distribution;
    }, {});
  }
}
