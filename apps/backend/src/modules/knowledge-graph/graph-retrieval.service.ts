import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ObservabilityService } from '../../infrastructure/observability';
import { AccessPolicyService, type KnowledgeResourceMetadata } from '../access-policy';
import { DocumentRepository } from '../document';
import {
  KnowledgeSpaceService,
  type KnowledgeSpaceEntity,
  type SpaceMemberRole,
} from '../knowledge-space';
import type { RetrievalAccessContext } from '../retrieval';
import { EntityExtractor } from './extractors/entity.extractor';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import type { GraphContext } from './knowledge-graph.types';

const retrievalPermissions = new Set(['knowledge.retrieve', 'knowledge.read']);

interface ScopedGraphAccess {
  accessContext: RetrievalAccessContext;
  spaceRolesById: Record<string, SpaceMemberRole | undefined>;
  spaceTenantIdsById: Record<string, string | null | undefined>;
}

@Injectable()
export class GraphRetrievalService {
  constructor(
    private readonly accessPolicyService: AccessPolicyService,
    private readonly documentRepository: DocumentRepository,
    private readonly entityExtractor: EntityExtractor,
    private readonly knowledgeGraphRepository: KnowledgeGraphRepository,
    private readonly knowledgeSpaceService: KnowledgeSpaceService,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async retrieveForContext(
    context: ExecutionContext,
    query: string,
    limit: number,
  ): Promise<GraphContext[]> {
    const scoped = await this.createScopedGraphAccess(context);

    if (!scoped.accessContext.canRetrieve) {
      return [];
    }

    const graphContexts = await this.retrieve(query, scoped.accessContext, limit);
    const documentMetadataById = await this.loadDocumentMetadataById(graphContexts);
    const filteredGraphContexts = this.accessPolicyService.filterGraphContexts(
      this.accessPolicyService.toSubject(context),
      graphContexts,
      {
        documentMetadataById,
        spaceRolesById: scoped.spaceRolesById,
        spaceTenantIdsById: scoped.spaceTenantIdsById,
      },
    );

    return filteredGraphContexts.map((graphContext) =>
      this.applyDocumentMetadata(graphContext, documentMetadataById[graphContext.documentId]),
    );
  }

  async retrieve(
    query: string,
    context: RetrievalAccessContext,
    limit: number,
  ): Promise<GraphContext[]> {
    const startedAt = Date.now();

    try {
      if (!context.canRetrieve || context.spaceIds.length === 0) {
        this.observabilityService.recordRetrieval({
          context,
          durationMs: Date.now() - startedAt,
          resultCount: 0,
          source: 'graph',
          status: 'success',
        });
        return [];
      }

      const entities = await this.entityExtractor.extract(query);
      const entityNames = entities.map((entity) => entity.name);
      const graphContexts = await this.knowledgeGraphRepository.searchByEntityNames(
        context.spaceIds,
        entityNames,
        limit,
      );

      this.observabilityService.recordRetrieval({
        context,
        durationMs: Date.now() - startedAt,
        resultCount: graphContexts.length,
        source: 'graph',
        status: 'success',
      });

      return graphContexts;
    } catch (error) {
      this.observabilityService.recordRetrieval({
        context,
        durationMs: Date.now() - startedAt,
        error,
        resultCount: 0,
        source: 'graph',
        status: 'failed',
      });
      throw error;
    }
  }

  private async createScopedGraphAccess(context: ExecutionContext): Promise<ScopedGraphAccess> {
    const spaces = await this.knowledgeSpaceService.list(context);
    const requestedSpaceIds = [...new Set(context.spaceIds.filter(Boolean))];
    const requestedSpaceIdSet = new Set(requestedSpaceIds);
    const selectedSpaces =
      requestedSpaceIds.length === 0
        ? spaces
        : spaces.filter((space) => requestedSpaceIdSet.has(space.id));
    const permissions = [...new Set(context.permissions.filter(Boolean))];
    const roles = [...new Set(context.roles.filter(Boolean))];
    const spaceIds = selectedSpaces.map((space) => space.id);

    return {
      accessContext: {
        canRetrieve:
          roles.length > 0 &&
          permissions.some((permission) => retrievalPermissions.has(permission)) &&
          spaceIds.length > 0,
        metadata: context.metadata,
        permissions,
        roles,
        spaceIds,
        userId: context.userId,
      },
      spaceRolesById: this.toSpaceRolesById(selectedSpaces, context.userId),
      spaceTenantIdsById: Object.fromEntries(
        selectedSpaces.map((space) => [space.id, space.tenantId]),
      ),
    };
  }

  private async loadDocumentMetadataById(
    graphContexts: GraphContext[],
  ): Promise<Record<string, KnowledgeResourceMetadata | undefined>> {
    const documentIds = [...new Set(graphContexts.map((graphContext) => graphContext.documentId))];
    const [contents, documents] = await Promise.all([
      this.documentRepository.findContentsByDocumentIds(documentIds),
      this.documentRepository.findActiveByIds(documentIds),
    ]);
    const contentByDocumentId = new Map(contents.map((content) => [content.documentId, content]));

    return Object.fromEntries(
      documents.map((document) => {
        const content = contentByDocumentId.get(document.id);

        return [
          document.id,
          {
            allowedDepartmentIds:
              document.accessScope.allowedDepartmentIds ?? content?.metadata.allowedDepartmentIds,
            departmentId: document.accessScope.departmentId ?? content?.metadata.departmentId,
            securityLevel: document.accessScope.securityLevel ?? content?.metadata.securityLevel,
            spaceId: content?.metadata.spaceId ?? document.spaceId,
          },
        ];
      }),
    );
  }

  private applyDocumentMetadata(
    graphContext: GraphContext,
    metadata: KnowledgeResourceMetadata | undefined,
  ): GraphContext {
    return {
      ...graphContext,
      allowedDepartmentIds: metadata?.allowedDepartmentIds ?? graphContext.allowedDepartmentIds,
      departmentId: metadata?.departmentId ?? graphContext.departmentId,
      securityLevel: metadata?.securityLevel ?? graphContext.securityLevel ?? 'INTERNAL',
      spaceId: graphContext.spaceId ?? metadata?.spaceId,
    };
  }

  private toSpaceRolesById(
    spaces: KnowledgeSpaceEntity[],
    userId: string,
  ): Record<string, SpaceMemberRole | undefined> {
    return Object.fromEntries(
      spaces.map((space) => [
        space.id,
        space.members.find((member) => member.userId === userId)?.role,
      ]),
    );
  }
}
