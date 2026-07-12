import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createAppConflictException, type ExecutionContext } from '../../common';
import { AuthRepository } from '../auth';
import { EnterpriseRepository } from './enterprise.repository';
import type {
  CreateDepartmentInput,
  CreateOrganizationInput,
  DepartmentEntity,
  EnterpriseDisableCheck,
  EnterpriseStructureEntity,
  EnterpriseContextEntity,
  OrganizationEntity,
  TenantEntity,
  UpdateDepartmentInput,
  UpdateOrganizationInput,
} from './enterprise.types';

@Injectable()
export class EnterpriseService {
  constructor(
    private readonly enterpriseRepository: EnterpriseRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  getContext(context: ExecutionContext): Promise<EnterpriseContextEntity> {
    return this.enterpriseRepository.findUserEnterpriseContext(context.userId);
  }

  async getCurrentTenant(context: ExecutionContext): Promise<TenantEntity | null> {
    return context.tenantId ? this.enterpriseRepository.findTenantById(context.tenantId) : null;
  }

  listDepartments(context: ExecutionContext): Promise<DepartmentEntity[]> {
    return context.tenantId
      ? this.enterpriseRepository.listDepartmentsByTenant(context.tenantId)
      : Promise.resolve([]);
  }

  listOrganizations(context: ExecutionContext): Promise<OrganizationEntity[]> {
    return context.tenantId
      ? this.enterpriseRepository.listOrganizationsByTenant(context.tenantId)
      : Promise.resolve([]);
  }

  async listStructure(context: ExecutionContext): Promise<EnterpriseStructureEntity> {
    return this.enterpriseRepository.listStructure(this.requireTenantId(context));
  }

  async createOrganization(
    context: ExecutionContext,
    input: Omit<CreateOrganizationInput, 'tenantId'>,
  ): Promise<OrganizationEntity> {
    const organization = await this.enterpriseRepository.createOrganization({
      ...input,
      name: input.name.trim(),
      tenantId: this.requireTenantId(context),
    });
    await this.audit(context, 'organization.created', 'organization', organization.id, undefined, organization);
    return organization;
  }

  async updateOrganization(
    context: ExecutionContext,
    organizationId: string,
    input: UpdateOrganizationInput,
  ): Promise<OrganizationEntity> {
    const tenantId = this.requireTenantId(context);
    const existing = await this.enterpriseRepository.findOrganizationById(organizationId);
    this.assertOrganizationTenant(existing, tenantId);

    if (input.status === 'DISABLED') {
      const check = await this.getOrganizationDisableCheck(context, organizationId);
      if (!check.canDisable) {
        throw createAppConflictException('CONFLICT', '请先停用或迁移该组织下的启用部门');
      }
    }

    const organization = await this.enterpriseRepository.updateOrganization(organizationId, {
      ...input,
      name: input.name?.trim(),
    });
    await this.audit(context, 'organization.updated', 'organization', organization.id, existing, organization);
    return organization;
  }

  async createDepartment(
    context: ExecutionContext,
    input: Omit<CreateDepartmentInput, 'tenantId'>,
  ): Promise<DepartmentEntity> {
    const tenantId = this.requireTenantId(context);
    const organization = await this.enterpriseRepository.findOrganizationById(input.organizationId);
    this.assertOrganizationTenant(organization, tenantId);
    if (organization.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot add a department to a disabled organization');
    }

    await this.assertValidParent(tenantId, input.organizationId, input.parentId);
    const department = await this.enterpriseRepository.createDepartment({
      ...input,
      name: input.name.trim(),
      tenantId,
    });
    await this.audit(context, 'department.created', 'department', department.id, undefined, department);
    return department;
  }

  async updateDepartment(
    context: ExecutionContext,
    departmentId: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentEntity> {
    const tenantId = this.requireTenantId(context);
    const existing = await this.enterpriseRepository.findDepartmentById(departmentId);
    this.assertDepartmentTenant(existing, tenantId);

    if (input.parentId !== undefined) {
      await this.assertValidParent(tenantId, existing.organizationId, input.parentId, departmentId);
    }

    if (input.status === 'DISABLED') {
      const check = await this.getDepartmentDisableCheck(context, departmentId);
      if (!check.canDisable) {
        throw createAppConflictException('CONFLICT', '请先迁移关联用户、知识库并停用下级部门');
      }
    }

    const department = await this.enterpriseRepository.updateDepartment(departmentId, {
      ...input,
      name: input.name?.trim(),
    });
    await this.audit(context, 'department.updated', 'department', department.id, existing, department);
    return department;
  }

  async getOrganizationDisableCheck(
    context: ExecutionContext,
    organizationId: string,
  ): Promise<EnterpriseDisableCheck> {
    const organization = await this.enterpriseRepository.findOrganizationById(organizationId);
    this.assertOrganizationTenant(organization, this.requireTenantId(context));
    const activeDepartmentCount = await this.enterpriseRepository.countActiveOrganizationDepartments(
      organizationId,
    );

    return {
      activeChildDepartmentCount: 0,
      activeDepartmentCount,
      canDisable: activeDepartmentCount === 0,
      knowledgeBaseCount: 0,
      userCount: 0,
    };
  }

  async getDepartmentDisableCheck(
    context: ExecutionContext,
    departmentId: string,
  ): Promise<EnterpriseDisableCheck> {
    const department = await this.enterpriseRepository.findDepartmentById(departmentId);
    this.assertDepartmentTenant(department, this.requireTenantId(context));
    const dependencies = await this.enterpriseRepository.getDepartmentDisableDependencies(departmentId);

    return {
      activeChildDepartmentCount: dependencies.activeChildDepartmentCount,
      activeDepartmentCount: 0,
      canDisable:
        dependencies.userCount === 0 &&
        dependencies.knowledgeBaseCount === 0 &&
        dependencies.activeChildDepartmentCount === 0,
      knowledgeBaseCount: dependencies.knowledgeBaseCount,
      userCount: dependencies.userCount,
    };
  }

  async getActiveDepartment(
    context: ExecutionContext,
    departmentId: string | undefined,
    required: boolean,
  ): Promise<DepartmentEntity | null> {
    if (!departmentId) {
      if (required) throw new BadRequestException('A department must be selected for this knowledge base type');
      return null;
    }

    const department = await this.enterpriseRepository.findDepartmentById(departmentId);
    this.assertDepartmentTenant(department, this.requireTenantId(context));
    if (department.status !== 'ACTIVE') {
      throw new BadRequestException('The selected department is disabled');
    }
    return department;
  }

  private requireTenantId(context: ExecutionContext): string {
    if (!context.tenantId) throw new BadRequestException('An enterprise tenant is required');
    return context.tenantId;
  }

  private assertOrganizationTenant(
    organization: OrganizationEntity | null,
    tenantId: string,
  ): asserts organization is OrganizationEntity {
    if (!organization || organization.tenantId !== tenantId) {
      throw new NotFoundException('Organization not found');
    }
  }

  private assertDepartmentTenant(
    department: DepartmentEntity | null,
    tenantId: string,
  ): asserts department is DepartmentEntity {
    if (!department || department.tenantId !== tenantId) {
      throw new NotFoundException('Department not found');
    }
  }

  private async assertValidParent(
    tenantId: string,
    organizationId: string,
    parentId?: string | null,
    departmentId?: string,
  ): Promise<void> {
    if (!parentId) return;
    if (parentId === departmentId) throw new BadRequestException('A department cannot be its own parent');

    let depth = 1;
    let cursorId: string | null = parentId;
    while (cursorId) {
      const parent = await this.enterpriseRepository.findDepartmentById(cursorId);
      this.assertDepartmentTenant(parent, tenantId);
      if (parent.organizationId !== organizationId || parent.status !== 'ACTIVE') {
        throw new BadRequestException('The parent department must be active and in the same organization');
      }
      if (parent.id === departmentId) throw new BadRequestException('Department hierarchy cannot contain a cycle');
      depth += 1;
      if (depth > 4) throw new BadRequestException('Department hierarchy is limited to four levels');
      cursorId = parent.parentId;
    }
  }

  private async audit(
    context: ExecutionContext,
    action: string,
    targetType: string,
    targetId: string,
    before: { code: string; id: string; name: string; status: string } | undefined,
    after: { code: string; id: string; name: string; status: string },
  ): Promise<void> {
    await this.authRepository.recordGovernanceAudit({
      action,
      actorUserId: context.userId,
      after: { code: after.code, name: after.name, status: after.status },
      before: before ? { code: before.code, name: before.name, status: before.status } : undefined,
      targetId,
      targetType,
      tenantId: context.tenantId,
    });
  }
}
