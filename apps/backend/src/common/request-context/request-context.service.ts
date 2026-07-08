import { ExecutionContext as NestExecutionContext, Injectable } from '@nestjs/common';
import type { ExecutionContext } from './execution-context';

type RequestContextUser = {
  id: string;
  roles: string[];
  permissions: string[];
  spaceIds: string[];
  tenantId?: string;
  organizationId?: string;
  departmentId?: string;
  metadata?: Record<string, unknown>;
};

type AuthenticatedRequest = {
  user?: RequestContextUser;
};

@Injectable()
export class RequestContextService {
  create(user: RequestContextUser): ExecutionContext {
    return {
      userId: user.id,
      roles: user.roles,
      permissions: user.permissions,
      spaceIds: user.spaceIds,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      metadata: user.metadata ?? {},
    };
  }

  fromExecutionContext(context: NestExecutionContext): ExecutionContext | null {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return request.user ? this.create(request.user) : null;
  }
}
