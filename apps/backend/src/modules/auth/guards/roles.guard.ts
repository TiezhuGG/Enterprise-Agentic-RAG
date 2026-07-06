import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestContextService } from '../../../common';
import { ROLES_METADATA_KEY } from '../decorators/authorization-metadata';

const unique = (values: string[]): string[] => [...new Set(values)];

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly requestContextService: RequestContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = unique(
      this.reflector.getAllAndMerge<string[]>(ROLES_METADATA_KEY, [
        context.getClass(),
        context.getHandler(),
      ]) ?? [],
    );

    if (requiredRoles.length === 0) {
      return true;
    }

    const requestContext = this.requestContextService.fromExecutionContext(context);

    if (!requestContext) {
      throw new UnauthorizedException('Authentication required');
    }

    return requiredRoles.some((role) => requestContext.roles.includes(role));
  }
}
