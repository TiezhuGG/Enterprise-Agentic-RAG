import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import {
  CurrentUser,
  JwtAuthGuard,
  Permissions,
  PermissionsGuard,
  Roles,
  RolesGuard,
  type AuthenticatedUser,
} from '../auth';
import {
  CreateDepartmentDto,
  CreateOrganizationDto,
  UpdateDepartmentDto,
  UpdateOrganizationDto,
} from './dto';
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

  @Get('structure')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  getStructure(@CurrentUser() user: AuthenticatedUser) {
    return this.enterpriseService.listStructure(this.createExecutionContext(user));
  }

  @Post('organizations')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  createOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateOrganizationDto,
  ): Promise<OrganizationEntity> {
    return this.enterpriseService.createOrganization(this.createExecutionContext(user), input);
  }

  @Get('organizations/:id/disable-check')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  getOrganizationDisableCheck(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.enterpriseService.getOrganizationDisableCheck(
      this.createExecutionContext(user),
      id,
    );
  }

  @Patch('organizations/:id')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  updateOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') organizationId: string,
    @Body() input: UpdateOrganizationDto,
  ): Promise<OrganizationEntity> {
    return this.enterpriseService.updateOrganization(
      this.createExecutionContext(user),
      organizationId,
      input,
    );
  }

  @Post('departments')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  createDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateDepartmentDto,
  ): Promise<DepartmentEntity> {
    return this.enterpriseService.createDepartment(this.createExecutionContext(user), input);
  }

  @Get('departments/:id/disable-check')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  getDepartmentDisableCheck(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.enterpriseService.getDepartmentDisableCheck(this.createExecutionContext(user), id);
  }

  @Patch('departments/:id')
  @Roles('admin')
  @Permissions('enterprise.manage')
  @UseGuards(RolesGuard, PermissionsGuard)
  updateDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') departmentId: string,
    @Body() input: UpdateDepartmentDto,
  ): Promise<DepartmentEntity> {
    return this.enterpriseService.updateDepartment(
      this.createExecutionContext(user),
      departmentId,
      input,
    );
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
