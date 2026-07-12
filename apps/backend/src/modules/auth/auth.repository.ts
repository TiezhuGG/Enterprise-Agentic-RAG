import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';

export interface UpsertRoleInput {
  code: string;
  name: string;
  description?: string;
  isSystem?: boolean;
}

export interface UpsertPermissionInput {
  code: string;
  name: string;
  description?: string;
}

export interface RoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface PermissionRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface GovernanceAuditInput {
  action: string;
  actorUserId: string;
  after?: Record<string, unknown>;
  before?: Record<string, unknown>;
  targetId: string;
  targetType: string;
  tenantId?: string;
}

export interface AuthorizationAuditRole {
  code: string;
  description: string | null;
  isSystem: boolean;
  name: string;
  permissions: string[];
}

export interface AuthorizationAuditUser {
  createdAt: Date;
  department: { code: string; id: string; name: string } | null;
  email: string;
  id: string;
  isActive: boolean;
  name: string | null;
  organization: { code: string; id: string; name: string } | null;
  roles: AuthorizationAuditRole[];
  spaceMemberships: Array<{
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
    space: {
      id: string;
      name: string;
      status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
      type: 'GENERAL' | 'DEPARTMENT' | 'PROJECT' | 'CUSTOMER';
    };
  }>;
  tenant: { code: string; id: string; name: string } | null;
  updatedAt: Date;
}

export interface UserCredentialsRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  isActive: boolean;
  mustChangePassword: boolean;
  roles: Array<{
    code: string;
    permissions: string[];
  }>;
}

type UserCredentialsModel = Omit<UserCredentialsRecord, 'roles'> & {
  roles: Array<{
    role: {
      code: string;
      permissions: Array<{
        permission: {
          code: string;
        };
      }>;
    };
  }>;
};

const toUserCredentialsRecord = (user: UserCredentialsModel): UserCredentialsRecord => ({
  id: user.id,
  email: user.email,
  passwordHash: user.passwordHash,
  isActive: user.isActive,
  mustChangePassword: user.mustChangePassword,
  roles: user.roles.map(({ role }) => ({
    code: role.code,
    permissions: role.permissions.map(({ permission }) => permission.code),
  })),
});

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserCredentialsByEmail(email: string): Promise<UserCredentialsRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        mustChangePassword: true,
        roles: {
          select: {
            role: {
              select: {
                code: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return user ? toUserCredentialsRecord(user) : null;
  }

  async recordGovernanceAudit(input: GovernanceAuditInput): Promise<void> {
    await this.prisma.governanceAuditEvent.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        after: input.after as Prisma.InputJsonValue | undefined,
        before: input.before as Prisma.InputJsonValue | undefined,
        targetId: input.targetId,
        targetType: input.targetType,
        tenantId: input.tenantId,
      },
    });
  }

  async listAuthorizationAuditRoles(): Promise<AuthorizationAuditRole[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: {
        code: 'asc',
      },
      select: {
        code: true,
        description: true,
        isSystem: true,
        name: true,
        permissions: {
          select: {
            permission: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    return roles.map((role) => ({
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      name: role.name,
      permissions: role.permissions.map(({ permission }) => permission.code),
    }));
  }

  async listAuthorizationAuditUsers(tenantId?: string): Promise<AuthorizationAuditUser[]> {
    const users = await this.prisma.user.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ email: 'asc' }],
      select: {
        createdAt: true,
        department: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        email: true,
        id: true,
        isActive: true,
        name: true,
        organization: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        roles: {
          select: {
            role: {
              select: {
                code: true,
                description: true,
                isSystem: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        code: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        spaces: {
          where: {
            space: {
              status: {
                not: 'DELETED',
              },
              ...(tenantId ? { tenantId } : {}),
            },
          },
          select: {
            role: true,
            space: {
              select: {
                id: true,
                name: true,
                status: true,
                type: true,
              },
            },
          },
        },
        tenant: {
          select: {
            code: true,
            id: true,
            name: true,
          },
        },
        updatedAt: true,
      },
    });

    return users.map((user) => ({
      createdAt: user.createdAt,
      department: user.department,
      email: user.email,
      id: user.id,
      isActive: user.isActive,
      name: user.name,
      organization: user.organization,
      roles: user.roles.map(({ role }) => ({
        code: role.code,
        description: role.description,
        isSystem: role.isSystem,
        name: role.name,
        permissions: role.permissions.map(({ permission }) => permission.code),
      })),
      spaceMemberships: user.spaces.map((membership) => ({
        role: membership.role,
        space: membership.space,
      })),
      tenant: user.tenant,
      updatedAt: user.updatedAt,
    }));
  }

  async upsertRole(input: UpsertRoleInput): Promise<RoleRecord> {
    return this.prisma.role.upsert({
      where: { code: input.code },
      update: {
        name: input.name,
        description: input.description,
        isSystem: input.isSystem,
      },
      create: {
        code: input.code,
        name: input.name,
        description: input.description,
        isSystem: input.isSystem ?? false,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
      },
    });
  }

  async upsertPermission(input: UpsertPermissionInput): Promise<PermissionRecord> {
    return this.prisma.permission.upsert({
      where: { code: input.code },
      update: {
        name: input.name,
        description: input.description,
      },
      create: {
        code: input.code,
        name: input.name,
        description: input.description,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
      },
    });
  }

  async attachPermissionToRole(roleCode: string, permissionCode: string): Promise<void> {
    const role = await this.prisma.role.findUnique({
      where: { code: roleCode },
      select: { id: true },
    });
    const permission = await this.prisma.permission.findUnique({
      where: { code: permissionCode },
      select: { id: true },
    });

    if (!role) {
      throw new Error(`Role not found: ${roleCode}`);
    }

    if (!permission) {
      throw new Error(`Permission not found: ${permissionCode}`);
    }

    await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }
}
