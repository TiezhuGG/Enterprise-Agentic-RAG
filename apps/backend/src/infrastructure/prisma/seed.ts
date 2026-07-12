import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { AppModule } from '../../app.module';
import { AuthRepository } from '../../modules/auth';
import { EnterpriseRepository } from '../../modules/enterprise';
import { UserRepository } from '../../modules/user';

export const seedAdminPassword = '123456';
const passwordSaltRounds = 10;

const permissions = [
  {
    code: 'user.read',
    name: '查看用户',
    description: '查看用户记录和已分配角色。',
  },
  {
    code: 'user.write',
    name: '管理用户',
    description: '创建和更新用户记录。',
  },
  {
    code: 'role.manage',
    name: '管理角色',
    description: '管理系统角色和权限。',
  },
  {
    code: 'enterprise.manage',
    name: '管理组织与部门',
    description: '维护组织、部门和用户归属。',
  },
  {
    code: 'knowledge.read',
    name: '查看知识库',
    description: '查看知识库、文档、切片和检索候选内容。',
  },
  {
    code: 'knowledge.retrieve',
    name: '检索知识库',
    description: '在已获授权的知识库中执行检索。',
  },
  {
    code: 'knowledge.confidential.read',
    name: '查看机密知识',
    description: '在策略允许时查看机密知识资源。',
  },
] as const;

const roles = [
  {
    code: 'admin',
    name: '系统管理员',
    description: '拥有平台级完整管理权限。',
    isSystem: true,
    permissions: [
      'user.read',
      'user.write',
      'role.manage',
      'enterprise.manage',
      'knowledge.read',
      'knowledge.retrieve',
      'knowledge.confidential.read',
    ],
  },
  {
    code: 'user',
    name: '标准用户',
    description: '拥有默认的已认证用户权限。',
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
      name: '系统管理员',
      passwordHash: await hash(seedAdminPassword, passwordSaltRounds),
      isActive: true,
    });

    await userRepository.replaceSystemRole(admin.id, 'admin');

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
    await userRepository.updatePassword(admin.id, await hash(seedAdminPassword, passwordSaltRounds), false);

    await enterpriseRepository.backfillUserKnowledgeSpacesTenant(admin.id, tenant.id);
  } finally {
    await app.close();
  }
}

void seed();
