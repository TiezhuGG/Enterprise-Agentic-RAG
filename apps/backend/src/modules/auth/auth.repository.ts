import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';

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

export interface UserCredentialsRecord {
  id: string;
  email: string;
  passwordHash: string | null;
  isActive: boolean;
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
