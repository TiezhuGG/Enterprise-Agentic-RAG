import { ForbiddenException, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import type {
  AccessControlledGraphContext,
  AccessControlledRetrievalResult,
  AccessPolicyDecision,
  AccessPolicyFilterContext,
  AccessPolicySecurityLevel,
  AccessPolicySubject,
  KnowledgeResourceAccess,
  KnowledgeResourceMetadata,
} from './access-policy.types';

const readSpaceRoles = new Set(['OWNER', 'EDITOR', 'VIEWER']);
const confidentialReadPermission = 'knowledge.confidential.read';
const adminRole = 'admin';

@Injectable()
export class AccessPolicyService {
  canReadKnowledgeResource(
    subject: AccessPolicySubject,
    resource: KnowledgeResourceAccess,
  ): AccessPolicyDecision {
    const tenantDecision = this.checkTenant(subject, resource);

    if (!tenantDecision.allowed) {
      return tenantDecision;
    }

    if (!resource.spaceRole || !readSpaceRoles.has(resource.spaceRole)) {
      return {
        allowed: false,
        reason: 'space_role_denied',
      };
    }

    const securityLevel = this.normalizeSecurityLevel(resource.securityLevel);

    if (securityLevel === 'CONFIDENTIAL' && !this.hasConfidentialAccess(subject, resource)) {
      return {
        allowed: false,
        reason: 'confidential_denied',
      };
    }

    if (
      securityLevel !== 'PUBLIC' &&
      this.hasDepartmentRestriction(resource) &&
      !this.hasDepartmentAccess(subject, resource)
    ) {
      return {
        allowed: false,
        reason: 'department_denied',
      };
    }

    return {
      allowed: true,
    };
  }

  assertCanReadKnowledgeResource(
    subject: AccessPolicySubject,
    resource: KnowledgeResourceAccess,
  ): void {
    const decision = this.canReadKnowledgeResource(subject, resource);

    if (!decision.allowed) {
      throw new ForbiddenException('Document access denied');
    }
  }

  filterRetrievalResults<TResult extends AccessControlledRetrievalResult>(
    subject: AccessPolicySubject,
    results: TResult[],
    context: AccessPolicyFilterContext,
  ): TResult[] {
    return results.filter((result) => {
      const resource = this.toResourceAccess(result.documentId, result.metadata, context);

      return this.canReadKnowledgeResource(subject, resource).allowed;
    });
  }

  filterGraphContexts<TResult extends AccessControlledGraphContext>(
    subject: AccessPolicySubject,
    contexts: TResult[],
    context: AccessPolicyFilterContext,
  ): TResult[] {
    return contexts.filter((graphContext) => {
      const metadata = this.mergeMetadata(
        context.documentMetadataById?.[graphContext.documentId],
        graphContext,
      );
      const resource = this.toResourceAccess(graphContext.documentId, metadata, context);

      return this.canReadKnowledgeResource(subject, resource).allowed;
    });
  }

  toSubject(context: ExecutionContext): AccessPolicySubject {
    return {
      departmentId: context.departmentId,
      permissions: context.permissions,
      roles: context.roles,
      tenantId: context.tenantId,
      userId: context.userId,
    };
  }

  toResourceAccess(
    documentId: string,
    metadata: KnowledgeResourceMetadata,
    context: AccessPolicyFilterContext,
  ): KnowledgeResourceAccess {
    const documentMetadata = context.documentMetadataById?.[documentId];
    const mergedMetadata = this.mergeMetadata(documentMetadata, metadata);
    const spaceId = mergedMetadata.spaceId ?? '';

    return {
      allowedDepartmentIds: this.normalizeDepartmentIds(mergedMetadata.allowedDepartmentIds),
      departmentId: this.normalizeString(mergedMetadata.departmentId),
      securityLevel: this.normalizeSecurityLevel(mergedMetadata.securityLevel),
      spaceId,
      spaceRole: context.spaceRolesById[spaceId] ?? null,
      tenantId: context.spaceTenantIdsById?.[spaceId] ?? undefined,
    };
  }

  private checkTenant(
    subject: AccessPolicySubject,
    resource: KnowledgeResourceAccess,
  ): AccessPolicyDecision {
    if (resource.tenantId === undefined) {
      return {
        allowed: true,
      };
    }

    if (subject.tenantId) {
      return resource.tenantId === subject.tenantId
        ? { allowed: true }
        : { allowed: false, reason: 'tenant_denied' };
    }

    return resource.tenantId === null
      ? { allowed: true }
      : { allowed: false, reason: 'tenant_denied' };
  }

  private hasConfidentialAccess(
    subject: AccessPolicySubject,
    resource: KnowledgeResourceAccess,
  ): boolean {
    return (
      resource.spaceRole === 'OWNER' ||
      subject.roles.includes(adminRole) ||
      subject.permissions.includes(confidentialReadPermission)
    );
  }

  private hasDepartmentAccess(
    subject: AccessPolicySubject,
    resource: KnowledgeResourceAccess,
  ): boolean {
    if (resource.spaceRole === 'OWNER') {
      return true;
    }

    if (!subject.departmentId) {
      return false;
    }

    const allowedDepartmentIds = this.normalizeDepartmentIds(resource.allowedDepartmentIds);

    if (allowedDepartmentIds.length > 0) {
      return allowedDepartmentIds.includes(subject.departmentId);
    }

    return resource.departmentId === subject.departmentId;
  }

  private hasDepartmentRestriction(resource: KnowledgeResourceAccess): boolean {
    return (
      this.normalizeDepartmentIds(resource.allowedDepartmentIds).length > 0 ||
      Boolean(this.normalizeString(resource.departmentId))
    );
  }

  private mergeMetadata(
    documentMetadata: KnowledgeResourceMetadata | undefined,
    resultMetadata: KnowledgeResourceMetadata,
  ): KnowledgeResourceMetadata {
    return {
      ...documentMetadata,
      ...resultMetadata,
      allowedDepartmentIds:
        documentMetadata?.allowedDepartmentIds ?? resultMetadata.allowedDepartmentIds,
      departmentId: documentMetadata?.departmentId ?? resultMetadata.departmentId,
      securityLevel: documentMetadata?.securityLevel ?? resultMetadata.securityLevel,
      spaceId: resultMetadata.spaceId ?? documentMetadata?.spaceId,
    };
  }

  private normalizeDepartmentIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((departmentId): departmentId is string => typeof departmentId === 'string')
      .map((departmentId) => departmentId.trim())
      .filter(Boolean);
  }

  private normalizeSecurityLevel(value: unknown): AccessPolicySecurityLevel {
    return value === 'PUBLIC' || value === 'CONFIDENTIAL' ? value : 'INTERNAL';
  }

  private normalizeString(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
