import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestContextService } from '../../../common';
import { PERMISSIONS_METADATA_KEY } from '../decorators/authorization-metadata';

const unique = (values: string[]): string[] => [...new Set(values)];

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContextService: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = unique(
      this.reflector.getAllAndMerge<string[]>(PERMISSIONS_METADATA_KEY, [
        context.getClass(),
        context.getHandler(),
      ]) ?? [],
    );

    if (requiredPermissions.length === 0) {
      return true;
    }

    const requestContext = this.requestContextService.fromExecutionContext(context);

    if (!requestContext) {
      throw new UnauthorizedException('Authentication required');
    }

    return requiredPermissions.every((permission) =>
      requestContext.permissions.includes(permission),
    );
  }
}
