import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { AppModule } from '../../app.module';
import { KnowledgeSpaceRepository, KnowledgeSpaceService } from '../../modules/knowledge-space';
import { UserRepository } from '../../modules/user';
import { PrismaService } from './prisma.service';

const testPassword = 'RoleTest123!';
const testSpaceName = '权限角色测试空间';

const testUsers = [
  { email: 'space-owner@example.com', name: 'Space Owner', role: 'OWNER' as const },
  { email: 'space-editor@example.com', name: 'Space Editor', role: 'EDITOR' as const },
  { email: 'space-viewer@example.com', name: 'Space Viewer', role: 'VIEWER' as const },
];

async function seedRoleTestAccounts() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const knowledgeSpaceRepository = app.get(KnowledgeSpaceRepository);
    const knowledgeSpaceService = app.get(KnowledgeSpaceService);
    const prisma = app.get(PrismaService);
    const userRepository = app.get(UserRepository);
    const admin = await userRepository.findByEmail('admin@example.com');

    if (!admin?.tenantId || !admin.organizationId || !admin.departmentId) {
      throw new Error('admin@example.com must be seeded with an enterprise context first.');
    }

    const existingSpace = await prisma.knowledgeSpace.findFirst({
      where: {
        name: testSpaceName,
        status: { not: 'DELETED' },
        tenantId: admin.tenantId,
      },
      include: { members: true },
    });
    const space =
      existingSpace ??
      (await knowledgeSpaceService.create(
        {
          departmentId: admin.departmentId,
          metadata: {},
          organizationId: admin.organizationId,
          permissions: [],
          roles: ['admin'],
          spaceIds: [],
          tenantId: admin.tenantId,
          userId: admin.id,
        },
        {
          description: '用于验证负责人、编辑者和查看者空间权限的共享测试空间。',
          name: testSpaceName,
          type: 'GENERAL',
          visibility: 'PRIVATE',
        },
      ));

    await knowledgeSpaceRepository.upsertMember(space.id, admin.id, 'OWNER');
    const passwordHash = await hash(testPassword, 10);

    for (const testUser of testUsers) {
      const user = await userRepository.upsert({
        departmentId: admin.departmentId,
        email: testUser.email,
        isActive: true,
        name: testUser.name,
        organizationId: admin.organizationId,
        passwordHash,
        tenantId: admin.tenantId,
      });
      await userRepository.assignRole(user.id, 'user');
      await knowledgeSpaceRepository.upsertMember(space.id, user.id, testUser.role);
    }

    console.log({
      password: testPassword,
      space: testSpaceName,
      users: ['admin@example.com', ...testUsers.map((user) => user.email)],
    });
  } finally {
    await app.close();
  }
}

void seedRoleTestAccounts();
