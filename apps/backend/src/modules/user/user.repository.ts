import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';

export interface CreateUserInput {
  email: string;
  name?: string;
  passwordHash?: string;
  isActive?: boolean;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    code: string;
    name: string;
  }>;
}

type UserModel = Omit<UserRecord, 'roles'> & {
  roles?: Array<{
    role: {
      code: string;
      name: string;
    };
  }>;
};

const toUserRecord = (user: UserModel): UserRecord => ({
  id: user.id,
  email: user.email,
  name: user.name,
  passwordHash: user.passwordHash,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  roles: user.roles?.map(({ role }) => ({ code: role.code, name: role.name })) ?? [],
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
            role: true,
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
            role: true,
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
        name: input.name,
        passwordHash: input.passwordHash,
        isActive: input.isActive,
      },
      create: {
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        isActive: input.isActive ?? true,
      },
      include: {
        roles: {
          include: {
            role: true,
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
