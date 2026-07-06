import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AuthRepository } from '../../modules/auth';
import { UserRepository } from '../../modules/user';

const permissions = [
  {
    code: 'user.read',
    name: 'Read users',
    description: 'View user records and assigned roles.',
  },
  {
    code: 'user.write',
    name: 'Write users',
    description: 'Create and update user records.',
  },
  {
    code: 'role.manage',
    name: 'Manage roles',
    description: 'Manage roles and permissions.',
  },
] as const;

const roles = [
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Full platform administration access.',
    isSystem: true,
    permissions: ['user.read', 'user.write', 'role.manage'],
  },
  {
    code: 'user',
    name: 'User',
    description: 'Default authenticated user access.',
    isSystem: true,
    permissions: ['user.read'],
  },
] as const;

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const authRepository = app.get(AuthRepository);
    const userRepository = app.get(UserRepository);

    for (const permission of permissions) {
      await authRepository.upsertPermission(permission);
    }

    for (const role of roles) {
      await authRepository.upsertRole(role);

      for (const permissionCode of role.permissions) {
        await authRepository.attachPermissionToRole(role.code, permissionCode);
      }
    }

    const admin = await userRepository.upsert({
      email: 'admin@example.com',
      name: 'System Administrator',
      passwordHash: 'seeded-admin-password-hash',
      isActive: true,
    });

    await userRepository.assignRole(admin.id, 'admin');
  } finally {
    await app.close();
  }
}

void seed();
