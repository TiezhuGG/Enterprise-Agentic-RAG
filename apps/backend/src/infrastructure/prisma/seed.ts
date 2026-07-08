import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { AppModule } from '../../app.module';
import { AuthRepository } from '../../modules/auth';
import { EnterpriseRepository } from '../../modules/enterprise';
import { UserRepository } from '../../modules/user';

export const seedAdminPassword = 'Admin123!';
const passwordSaltRounds = 10;

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
  {
    code: 'knowledge.read',
    name: 'Read knowledge',
    description: 'Read knowledge spaces, documents, chunks, and retrieval candidates.',
  },
  {
    code: 'knowledge.retrieve',
    name: 'Retrieve knowledge',
    description: 'Run knowledge retrieval over accessible spaces.',
  },
] as const;

const roles = [
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Full platform administration access.',
    isSystem: true,
    permissions: ['user.read', 'user.write', 'role.manage', 'knowledge.read', 'knowledge.retrieve'],
  },
  {
    code: 'user',
    name: 'User',
    description: 'Default authenticated user access.',
    isSystem: true,
    permissions: ['user.read', 'knowledge.read', 'knowledge.retrieve'],
  },
] as const;

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const authRepository = app.get(AuthRepository);
    const enterpriseRepository = app.get(EnterpriseRepository);
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
      passwordHash: await hash(seedAdminPassword, passwordSaltRounds),
      isActive: true,
    });

    await userRepository.assignRole(admin.id, 'admin');

    const tenant = await enterpriseRepository.upsertTenant({
      code: 'default',
      name: 'Default Tenant',
      metadata: {
        seeded: true,
      },
    });
    const organization = await enterpriseRepository.upsertOrganization({
      code: 'default-org',
      name: 'Default Organization',
      tenantId: tenant.id,
      metadata: {
        seeded: true,
      },
    });
    const department = await enterpriseRepository.upsertDepartment({
      code: 'ai-lab',
      name: 'AI Lab',
      organizationId: organization.id,
      tenantId: tenant.id,
      metadata: {
        seeded: true,
      },
    });

    await enterpriseRepository.assignUserEnterprise(admin.id, {
      departmentId: department.id,
      organizationId: organization.id,
      tenantId: tenant.id,
    });

    await enterpriseRepository.backfillUserKnowledgeSpacesTenant(admin.id, tenant.id);
  } finally {
    await app.close();
  }
}

void seed();
