import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type {
  AssignUserEnterpriseInput,
  DepartmentEntity,
  EnterpriseContextEntity,
  OrganizationEntity,
  TenantEntity,
  UpsertDepartmentInput,
  UpsertOrganizationInput,
  UpsertTenantInput,
} from './enterprise.types';

type MetadataValue = Record<string, unknown>;

type TenantModel = Omit<TenantEntity, 'metadata'> & {
  metadata: unknown;
};

type OrganizationModel = Omit<OrganizationEntity, 'metadata'> & {
  metadata: unknown;
};

type DepartmentModel = Omit<DepartmentEntity, 'metadata'> & {
  metadata: unknown;
};

type UserEnterpriseModel = {
  department: DepartmentModel | null;
  organization: OrganizationModel | null;
  tenant: TenantModel | null;
};

const toMetadata = (metadata: unknown): MetadataValue =>
  typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)
    ? (metadata as MetadataValue)
    : {};

const toPrismaMetadata = (metadata: MetadataValue = {}): Prisma.InputJsonObject =>
  metadata as Prisma.InputJsonObject;

const toTenantEntity = (tenant: TenantModel): TenantEntity => ({
  ...tenant,
  metadata: toMetadata(tenant.metadata),
});

const toOrganizationEntity = (organization: OrganizationModel): OrganizationEntity => ({
  ...organization,
  metadata: toMetadata(organization.metadata),
});

const toDepartmentEntity = (department: DepartmentModel): DepartmentEntity => ({
  ...department,
  metadata: toMetadata(department.metadata),
});

const toEnterpriseContextEntity = (user: UserEnterpriseModel | null): EnterpriseContextEntity => ({
  department: user?.department ? toDepartmentEntity(user.department) : null,
  organization: user?.organization ? toOrganizationEntity(user.organization) : null,
  tenant: user?.tenant ? toTenantEntity(user.tenant) : null,
});

@Injectable()
export class EnterpriseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async assignUserEnterprise(userId: string, input: AssignUserEnterpriseInput): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        departmentId: input.departmentId,
        organizationId: input.organizationId,
        tenantId: input.tenantId,
      },
    });
  }

  async findTenantById(tenantId: string): Promise<TenantEntity | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    return tenant ? toTenantEntity(tenant) : null;
  }

  async findUserEnterpriseContext(userId: string): Promise<EnterpriseContextEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        department: true,
        organization: true,
        tenant: true,
      },
    });

    return toEnterpriseContextEntity(user);
  }

  async listDepartmentsByTenant(tenantId: string): Promise<DepartmentEntity[]> {
    const departments = await this.prisma.department.findMany({
      where: {
        status: 'ACTIVE',
        tenantId,
      },
      orderBy: [{ organizationId: 'asc' }, { name: 'asc' }],
    });

    return departments.map(toDepartmentEntity);
  }

  async listOrganizationsByTenant(tenantId: string): Promise<OrganizationEntity[]> {
    const organizations = await this.prisma.organization.findMany({
      where: {
        status: 'ACTIVE',
        tenantId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return organizations.map(toOrganizationEntity);
  }

  async upsertDepartment(input: UpsertDepartmentInput): Promise<DepartmentEntity> {
    const department = await this.prisma.department.upsert({
      where: {
        tenantId_code: {
          code: input.code,
          tenantId: input.tenantId,
        },
      },
      update: {
        metadata: input.metadata ? toPrismaMetadata(input.metadata) : undefined,
        name: input.name,
        organizationId: input.organizationId,
        parentId: input.parentId,
        status: input.status,
      },
      create: {
        code: input.code,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
        organizationId: input.organizationId,
        parentId: input.parentId,
        status: input.status ?? 'ACTIVE',
        tenantId: input.tenantId,
      },
    });

    return toDepartmentEntity(department);
  }

  async upsertOrganization(input: UpsertOrganizationInput): Promise<OrganizationEntity> {
    const organization = await this.prisma.organization.upsert({
      where: {
        tenantId_code: {
          code: input.code,
          tenantId: input.tenantId,
        },
      },
      update: {
        metadata: input.metadata ? toPrismaMetadata(input.metadata) : undefined,
        name: input.name,
        status: input.status,
      },
      create: {
        code: input.code,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
        status: input.status ?? 'ACTIVE',
        tenantId: input.tenantId,
      },
    });

    return toOrganizationEntity(organization);
  }

  async upsertTenant(input: UpsertTenantInput): Promise<TenantEntity> {
    const tenant = await this.prisma.tenant.upsert({
      where: {
        code: input.code,
      },
      update: {
        metadata: input.metadata ? toPrismaMetadata(input.metadata) : undefined,
        name: input.name,
        status: input.status,
      },
      create: {
        code: input.code,
        metadata: toPrismaMetadata(input.metadata),
        name: input.name,
        status: input.status ?? 'ACTIVE',
      },
    });

    return toTenantEntity(tenant);
  }
}
