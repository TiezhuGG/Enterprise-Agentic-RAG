import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';

export interface CreateUserInput {
  departmentId?: string;
  email: string;
  name?: string;
  organizationId?: string;
  passwordHash?: string;
  isActive?: boolean;
  tenantId?: string;
  mustChangePassword?: boolean;
}

export interface UserEnterpriseSummary {
  code: string;
  id: string;
  name: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  mustChangePassword: boolean;
  isActive: boolean;
  tenantId: string | null;
  organizationId: string | null;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  department: UserEnterpriseSummary | null;
  organization: UserEnterpriseSummary | null;
  roles: Array<{
    code: string;
    name: string;
    permissions: string[];
  }>;
  spaceIds: string[];
  tenant: UserEnterpriseSummary | null;
}

export interface ActiveTenantUserCandidate {
  department: UserEnterpriseSummary | null;
  email: string;
  id: string;
  name: string | null;
  roles: string[];
}

type EnterpriseSummaryModel = {
  code: string;
  id: string;
  name: string;
};

type UserModel = Omit<
  UserRecord,
  'department' | 'organization' | 'roles' | 'spaceIds' | 'tenant'
> & {
  department?: EnterpriseSummaryModel | null;
  organization?: EnterpriseSummaryModel | null;
  roles?: Array<{
    role: {
      code: string;
      name: string;
      permissions?: Array<{
        permission: {
          code: string;
        };
      }>;
    };
  }>;
  spaces?: Array<{
    spaceId: string;
    space: {
      tenantId: string | null;
    };
  }>;
  tenant?: EnterpriseSummaryModel | null;
};

const toUserRecord = (user: UserModel): UserRecord => ({
  id: user.id,
  email: user.email,
  name: user.name,
  passwordHash: user.passwordHash,
  mustChangePassword: user.mustChangePassword,
  isActive: user.isActive,
  tenantId: user.tenantId,
  organizationId: user.organizationId,
  departmentId: user.departmentId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  department: user.department ?? null,
  organization: user.organization ?? null,
  roles:
    user.roles?.map(({ role }) => ({
      code: role.code,
      name: role.name,
      permissions: role.permissions?.map(({ permission }) => permission.code) ?? [],
    })) ?? [],
  spaceIds:
    user.spaces
      ?.filter((space) => space.space.tenantId === (user.tenantId ?? null))
      .map((space) => space.spaceId) ?? [],
  tenant: user.tenant ?? null,
});

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        spaces: {
          select: {
            space: {
              select: {
                tenantId: true,
              },
            },
            spaceId: true,
          },
        },
        tenant: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
      },
    });

    return user ? toUserRecord(user) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        spaces: {
          select: {
            space: {
              select: {
                tenantId: true,
              },
            },
            spaceId: true,
          },
        },
        tenant: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
      },
    });

    return user ? toUserRecord(user) : null;
  }

  async upsert(input: CreateUserInput): Promise<UserRecord> {
    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      update: {
        departmentId: input.departmentId,
        name: input.name,
        organizationId: input.organizationId,
        passwordHash: input.passwordHash,
        mustChangePassword: input.mustChangePassword,
        isActive: input.isActive,
        tenantId: input.tenantId,
      },
      create: {
        departmentId: input.departmentId,
        email: input.email,
        name: input.name,
        organizationId: input.organizationId,
        passwordHash: input.passwordHash,
        mustChangePassword: input.mustChangePassword ?? false,
        isActive: input.isActive ?? true,
        tenantId: input.tenantId,
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        spaces: {
          select: {
            space: {
              select: {
                tenantId: true,
              },
            },
            spaceId: true,
          },
        },
        tenant: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        organization: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
      },
    });

    return toUserRecord(user);
  }

  async assignRole(userId: string, roleCode: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      select: { id: true },
    });

    if (!role) {
      throw new Error(`Role not found: ${roleCode}`);
    }

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId,
        roleId: role.id,
      },
    });
  }

  async replaceSystemRole(userId: string, roleCode: 'admin' | 'user'): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      select: { id: true },
    });
    if (!role) throw new Error(`Role not found: ${roleCode}`);

    await this.prisma.$transaction(async (transaction) => {
      await transaction.userRole.deleteMany({ where: { userId } });
      await transaction.userRole.create({ data: { roleId: role.id, userId } });
    });
  }

  async findActiveDepartmentForTenant(
    tenantId: string,
    departmentId: string,
  ): Promise<UserEnterpriseSummary & { organizationId: string }> {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, status: 'ACTIVE', tenantId },
      select: { code: true, id: true, name: true, organizationId: true },
    });
    if (!department) throw new Error('Department not found');
    return department;
  }

  async createGovernanceUser(input: {
    departmentId: string;
    email: string;
    name?: string;
    passwordHash: string;
    tenantId: string;
  }): Promise<UserRecord> {
    const department = await this.findActiveDepartmentForTenant(input.tenantId, input.departmentId);
    const created = await this.prisma.user.create({
      data: {
        departmentId: department.id,
        email: input.email,
        isActive: true,
        mustChangePassword: true,
        name: input.name,
        organizationId: department.organizationId,
        passwordHash: input.passwordHash,
        tenantId: input.tenantId,
      },
    });
    const user = await this.findById(created.id);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateGovernanceUser(
    userId: string,
    input: { departmentId?: string; isActive?: boolean; name?: string; tenantId: string },
  ): Promise<UserRecord> {
    const department = input.departmentId
      ? await this.findActiveDepartmentForTenant(input.tenantId, input.departmentId)
      : null;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        departmentId: department?.id,
        isActive: input.isActive,
        name: input.name,
        organizationId: department?.organizationId,
      },
    });
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  async updatePassword(
    userId: string,
    passwordHash: string,
    mustChangePassword: boolean,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { mustChangePassword, passwordHash },
    });
  }

  async countActiveTenantAdmins(tenantId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        isActive: true,
        tenantId,
        roles: { some: { role: { code: 'admin' } } },
      },
    });
  }

  async listActiveTenantUserCandidates(
    tenantId: string,
    spaceId: string,
    search?: string,
  ): Promise<ActiveTenantUserCandidate[]> {
    const query = search?.trim();
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        tenantId,
        ...(query
          ? {
              OR: [
                { email: { contains: query, mode: 'insensitive' } },
                { name: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      select: {
        department: { select: { code: true, id: true, name: true } },
        email: true,
        id: true,
        name: true,
        roles: { select: { role: { select: { code: true } } } },
        spaces: { where: { spaceId }, select: { role: true } },
      },
      take: 100,
    });

    return users
      .filter((user) => user.spaces.length === 0)
      .map((user) => ({
        department: user.department,
        email: user.email,
        id: user.id,
        name: user.name,
        roles: user.roles.map(({ role }) => role.code),
      }));
  }
}
