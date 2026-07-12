import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type {
  AssignUserEnterpriseInput,
  CreateDepartmentInput,
  CreateOrganizationInput,
  DepartmentEntity,
  EnterpriseStructureEntity,
  EnterpriseContextEntity,
  OrganizationEntity,
  TenantEntity,
  UpdateDepartmentInput,
  UpdateOrganizationInput,
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

type GovernedDepartmentModel = DepartmentModel & {
  _count: { knowledgeSpaces: number; users: number };
};

type GovernedOrganizationModel = OrganizationModel & {
  departments: GovernedDepartmentModel[];
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

  async backfillUserKnowledgeSpacesTenant(userId: string, tenantId: string): Promise<number> {
    const result = await this.prisma.knowledgeSpace.updateMany({
      where: {
        tenantId: null,
        OR: [
          {
            ownerId: userId,
          },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
      data: {
        tenantId,
      },
    });

    return result.count;
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

  async listStructure(tenantId: string): Promise<EnterpriseStructureEntity> {
    const [tenant, organizations] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.organization.findMany({
        where: { tenantId },
        include: {
          departments: {
            include: {
              _count: { select: { knowledgeSpaces: true, users: true } },
            },
            orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return {
      tenant: tenant ? toTenantEntity(tenant) : null,
      organizations: (organizations as GovernedOrganizationModel[]).map((organization) => ({
        ...toOrganizationEntity(organization),
        departments: organization.departments.map((department) => ({
          ...toDepartmentEntity(department),
          knowledgeBaseCount: department._count.knowledgeSpaces,
          userCount: department._count.users,
        })),
      })),
    };
  }

  async findOrganizationById(organizationId: string): Promise<OrganizationEntity | null> {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    return organization ? toOrganizationEntity(organization) : null;
  }

  async createOrganization(input: CreateOrganizationInput): Promise<OrganizationEntity> {
    const organization = await this.prisma.organization.create({
      data: {
        code: this.generateCode('org'),
        name: input.name,
        tenantId: input.tenantId,
      },
    });

    return toOrganizationEntity(organization);
  }

  async updateOrganization(
    organizationId: string,
    input: UpdateOrganizationInput,
  ): Promise<OrganizationEntity> {
    const organization = await this.prisma.organization.update({
      where: { id: organizationId },
      data: input,
    });

    return toOrganizationEntity(organization);
  }

  async findDepartmentById(departmentId: string): Promise<DepartmentEntity | null> {
    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });
    return department ? toDepartmentEntity(department) : null;
  }

  async createDepartment(input: CreateDepartmentInput): Promise<DepartmentEntity> {
    const department = await this.prisma.department.create({
      data: {
        code: this.generateCode('dept'),
        name: input.name,
        organizationId: input.organizationId,
        parentId: input.parentId,
        tenantId: input.tenantId,
      },
    });

    return toDepartmentEntity(department);
  }

  async updateDepartment(
    departmentId: string,
    input: UpdateDepartmentInput,
  ): Promise<DepartmentEntity> {
    const department = await this.prisma.department.update({
      where: { id: departmentId },
      data: input,
    });

    return toDepartmentEntity(department);
  }

  async countDepartmentDependencies(departmentId: string): Promise<{
    knowledgeBases: number;
    users: number;
  }> {
    const [knowledgeBases, users] = await Promise.all([
      this.prisma.knowledgeSpace.count({ where: { departmentId, status: { not: 'DELETED' } } }),
      this.prisma.user.count({ where: { departmentId } }),
    ]);

    return { knowledgeBases, users };
  }

  async countActiveOrganizationDepartments(organizationId: string): Promise<number> {
    return this.prisma.department.count({ where: { organizationId, status: 'ACTIVE' } });
  }

  async countActiveChildDepartments(departmentId: string): Promise<number> {
    return this.prisma.department.count({ where: { parentId: departmentId, status: 'ACTIVE' } });
  }

  async getDepartmentDisableDependencies(departmentId: string): Promise<{
    activeChildDepartmentCount: number;
    knowledgeBaseCount: number;
    userCount: number;
  }> {
    const [dependencies, activeChildDepartmentCount] = await Promise.all([
      this.countDepartmentDependencies(departmentId),
      this.countActiveChildDepartments(departmentId),
    ]);

    return {
      activeChildDepartmentCount,
      knowledgeBaseCount: dependencies.knowledgeBases,
      userCount: dependencies.users,
    };
  }

  private generateCode(prefix: 'dept' | 'org'): string {
    return `${prefix}-${randomUUID().replaceAll('-', '').slice(0, 12)}`;
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
