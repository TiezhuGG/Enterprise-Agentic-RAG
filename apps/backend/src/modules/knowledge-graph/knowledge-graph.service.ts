import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { ChunkRepository } from '../chunk';
import { DocumentRepository } from '../document';
import { EntityExtractor } from './extractors/entity.extractor';
import { RelationExtractor } from './extractors/relation.extractor';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import type {
  ExtractedEntity,
  GraphDocumentCounts,
  GraphEntity,
  GraphExtractionResult,
  GraphRelation,
} from './knowledge-graph.types';

const normalizeName = (name: string): string => name.trim().toLowerCase();

@Injectable()
export class KnowledgeGraphService {
  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly documentRepository: DocumentRepository,
    private readonly entityExtractor: EntityExtractor,
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
          documentId: document.id,
          source: source.name,
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
      documentId: document.id,
      entityCount: entities.length,
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

  private toGraphEntities(
    spaceId: string,
    documentId: string,
    entities: ExtractedEntity[],
  ): GraphEntity[] {
    return entities.map((entity) => ({
      id: this.createEntityId(spaceId, documentId, entity.name),
      name: entity.name,
      type: entity.type,
      spaceId,
      documentId,
    }));
  }
}
