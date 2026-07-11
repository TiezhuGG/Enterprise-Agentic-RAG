import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type { Prisma } from '../../infrastructure/prisma/generated/client';
import type {
  KnowledgeSpaceEntity,
  KnowledgeSpaceMetadata,
  KnowledgeSpaceStatus,
  KnowledgeSpaceType,
  KnowledgeSpaceVisibility,
  SpaceMemberEntity,
  SpaceMemberDetailEntity,
  SpaceMemberRole,
  SpaceMemberUserEntity,
} from './entities/knowledge-space.entity';
import { normalizeKnowledgeSpaceMetadata } from './entities/knowledge-space.entity';

export interface CreateKnowledgeSpaceInput {
  name: string;
  description?: string;
  visibility?: KnowledgeSpaceVisibility;
  type?: KnowledgeSpaceType;
  metadata?: KnowledgeSpaceMetadata;
  ownerId: string;
  tenantId?: string;
}

export interface UpdateKnowledgeSpaceInput {
  name?: string;
  description?: string;
  visibility?: KnowledgeSpaceVisibility;
  type?: KnowledgeSpaceType;
  metadata?: KnowledgeSpaceMetadata;
  status?: KnowledgeSpaceStatus;
}

type SpaceMemberModel = {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
};

type SpaceMemberDetailModel = SpaceMemberModel & {
  user: SpaceMemberUserEntity;
};

type KnowledgeSpaceModel = Omit<KnowledgeSpaceEntity, 'members' | 'metadata'> & {
  metadata: unknown;
  members?: SpaceMemberModel[];
};

const toSpaceMemberEntity = (member: SpaceMemberModel): SpaceMemberEntity => ({
  spaceId: member.spaceId,
  userId: member.userId,
  role: member.role,
});

const toSpaceMemberDetailEntity = (member: SpaceMemberDetailModel): SpaceMemberDetailEntity => ({
  ...toSpaceMemberEntity(member),
  user: {
    departmentId: member.user.departmentId,
    email: member.user.email,
    id: member.user.id,
    name: member.user.name,
    organizationId: member.user.organizationId,
    tenantId: member.user.tenantId,
  },
});

const toKnowledgeSpaceEntity = (space: KnowledgeSpaceModel): KnowledgeSpaceEntity => ({
  id: space.id,
  name: space.name,
  description: space.description,
  visibility: space.visibility,
  type: space.type,
  status: space.status,
  ownerId: space.ownerId,
  tenantId: space.tenantId,
  metadata: normalizeKnowledgeSpaceMetadata(space.metadata),
  createdAt: space.createdAt,
  updatedAt: space.updatedAt,
  members: space.members?.map(toSpaceMemberEntity) ?? [],
});

const toPrismaKnowledgeSpaceMetadata = (
  metadata: KnowledgeSpaceMetadata | undefined,
): Prisma.InputJsonObject | undefined => {
  if (!metadata) {
    return undefined;
  }

  return normalizeKnowledgeSpaceMetadata(metadata) as Prisma.InputJsonObject;
};

@Injectable()
export class KnowledgeSpaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateKnowledgeSpaceInput): Promise<KnowledgeSpaceEntity> {
    const space = await this.prisma.knowledgeSpace.create({
      data: {
        name: input.name,
        description: input.description,
        visibility: input.visibility ?? 'PRIVATE',
        type: input.type ?? 'GENERAL',
        metadata: toPrismaKnowledgeSpaceMetadata(input.metadata),
        ownerId: input.ownerId,
        tenantId: input.tenantId,
        members: {
          create: {
            userId: input.ownerId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });

    return toKnowledgeSpaceEntity(space);
  }

  async listForUser(userId: string, tenantId?: string): Promise<KnowledgeSpaceEntity[]> {
    const spaces = await this.prisma.knowledgeSpace.findMany({
      where: {
        status: {
          not: 'DELETED',
        },
        tenantId: this.toTenantFilter(tenantId),
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return spaces.map(toKnowledgeSpaceEntity);
  }

  async listAccessibleSpaceIds(userId: string, tenantId?: string): Promise<string[]> {
    const spaces = await this.prisma.knowledgeSpace.findMany({
      where: {
        status: {
          not: 'DELETED',
        },
        tenantId: this.toTenantFilter(tenantId),
        members: {
          some: {
            userId,
          },
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return spaces.map((space) => space.id);
  }

  async findAccessibleById(
    spaceId: string,
    userId: string,
    tenantId?: string,
  ): Promise<KnowledgeSpaceEntity | null> {
    const space = await this.prisma.knowledgeSpace.findFirst({
      where: {
        id: spaceId,
        status: {
          not: 'DELETED',
        },
        tenantId: this.toTenantFilter(tenantId),
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
    });

    return space ? toKnowledgeSpaceEntity(space) : null;
  }

  async findMember(spaceId: string, userId: string): Promise<SpaceMemberEntity | null> {
    const member = await this.prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId,
          userId,
        },
      },
    });

    return member ? toSpaceMemberEntity(member) : null;
  }

  async listMembers(spaceId: string): Promise<SpaceMemberDetailEntity[]> {
    const members = await this.prisma.spaceMember.findMany({
      where: {
        spaceId,
      },
      include: {
        user: {
          select: {
            departmentId: true,
            email: true,
            id: true,
            name: true,
            organizationId: true,
            tenantId: true,
          },
        },
      },
      orderBy: [
        {
          role: 'asc',
        },
        {
          user: {
            email: 'asc',
          },
        },
      ],
    });

    return members.map(toSpaceMemberDetailEntity);
  }

  async countOwners(spaceId: string): Promise<number> {
    return this.prisma.spaceMember.count({
      where: {
        role: 'OWNER',
        spaceId,
      },
    });
  }

  async upsertMember(
    spaceId: string,
    userId: string,
    role: SpaceMemberRole,
  ): Promise<SpaceMemberDetailEntity> {
    const member = await this.prisma.spaceMember.upsert({
      where: {
        spaceId_userId: {
          spaceId,
          userId,
        },
      },
      create: {
        role,
        spaceId,
        userId,
      },
      update: {
        role,
      },
      include: {
        user: {
          select: {
            departmentId: true,
            email: true,
            id: true,
            name: true,
            organizationId: true,
            tenantId: true,
          },
        },
      },
    });

    return toSpaceMemberDetailEntity(member);
  }

  async updateMemberRole(
    spaceId: string,
    userId: string,
    role: SpaceMemberRole,
  ): Promise<SpaceMemberDetailEntity> {
    const member = await this.prisma.spaceMember.update({
      where: {
        spaceId_userId: {
          spaceId,
          userId,
        },
      },
      data: {
        role,
      },
      include: {
        user: {
          select: {
            departmentId: true,
            email: true,
            id: true,
            name: true,
            organizationId: true,
            tenantId: true,
          },
        },
      },
    });

    return toSpaceMemberDetailEntity(member);
  }

  async deleteMember(spaceId: string, userId: string): Promise<void> {
    await this.prisma.spaceMember.delete({
      where: {
        spaceId_userId: {
          spaceId,
          userId,
        },
      },
    });
  }

  async update(spaceId: string, input: UpdateKnowledgeSpaceInput): Promise<KnowledgeSpaceEntity> {
    const space = await this.prisma.knowledgeSpace.update({
      where: {
        id: spaceId,
      },
      data: {
        ...input,
        metadata: toPrismaKnowledgeSpaceMetadata(input.metadata),
      },
      include: {
        members: true,
      },
    });

    return toKnowledgeSpaceEntity(space);
  }

  private toTenantFilter(tenantId: string | undefined): string | null {
    return tenantId ?? null;
  }
}
