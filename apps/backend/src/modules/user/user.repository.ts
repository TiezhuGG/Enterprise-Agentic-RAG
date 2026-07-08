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
  }>;
  tenant?: EnterpriseSummaryModel | null;
};

const toUserRecord = (user: UserModel): UserRecord => ({
  id: user.id,
  email: user.email,
  name: user.name,
  passwordHash: user.passwordHash,
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
  spaceIds: user.spaces?.map((space) => space.spaceId) ?? [],
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
        isActive: input.isActive,
        tenantId: input.tenantId,
      },
      create: {
        departmentId: input.departmentId,
        email: input.email,
        name: input.name,
        organizationId: input.organizationId,
        passwordHash: input.passwordHash,
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
}
