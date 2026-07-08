import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { EnterpriseService } from './enterprise.service';
import type {
  DepartmentEntity,
  EnterpriseContextEntity,
  OrganizationEntity,
  TenantEntity,
} from './enterprise.types';

@Controller('enterprise')
@UseGuards(JwtAuthGuard)
export class EnterpriseController {
  constructor(
    private readonly enterpriseService: EnterpriseService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Get('context')
  getContext(@CurrentUser() user: AuthenticatedUser): Promise<EnterpriseContextEntity> {
    return this.enterpriseService.getContext(this.createExecutionContext(user));
  }

  @Get('tenants/current')
  getCurrentTenant(@CurrentUser() user: AuthenticatedUser): Promise<TenantEntity | null> {
    return this.enterpriseService.getCurrentTenant(this.createExecutionContext(user));
  }

  @Get('organizations')
  listOrganizations(@CurrentUser() user: AuthenticatedUser): Promise<OrganizationEntity[]> {
    return this.enterpriseService.listOrganizations(this.createExecutionContext(user));
  }

  @Get('departments')
  listDepartments(@CurrentUser() user: AuthenticatedUser): Promise<DepartmentEntity[]> {
    return this.enterpriseService.listDepartments(this.createExecutionContext(user));
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
