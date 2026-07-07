import { Injectable } from '@nestjs/common';
import {
  retrievalPermissions,
  type KnowledgeRequestContext,
  type RetrievalAccessContext,
} from '../retrieval.types';

const unique = (values: string[]): string[] => [...new Set(values.filter(Boolean))];

@Injectable()
export class ContextBuilder {
  build(context: KnowledgeRequestContext): RetrievalAccessContext {
    const roles = unique(context.roles);
    const permissions = unique(context.permissions);
    const spaceIds = unique(context.spaceIds);
    const hasRetrievalPermission = permissions.some((permission) =>
      retrievalPermissions.includes(permission as (typeof retrievalPermissions)[number]),
    );

    return {
      userId: context.userId,
      roles,
      permissions,
      spaceIds,
      canRetrieve: roles.length > 0 && hasRetrievalPermission && spaceIds.length > 0,
    };
  }
}
