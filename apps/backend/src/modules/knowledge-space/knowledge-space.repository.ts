import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma';
import type {
  KnowledgeSpaceEntity,
  KnowledgeSpaceStatus,
  KnowledgeSpaceVisibility,
  SpaceMemberEntity,
  SpaceMemberRole,
} from './entities/knowledge-space.entity';

export interface CreateKnowledgeSpaceInput {
  name: string;
  description?: string;
  visibility?: KnowledgeSpaceVisibility;
  ownerId: string;
  tenantId?: string;
}

export interface UpdateKnowledgeSpaceInput {
  name?: string;
  description?: string;
  visibility?: KnowledgeSpaceVisibility;
  status?: KnowledgeSpaceStatus;
}

type SpaceMemberModel = {
  spaceId: string;
  userId: string;
  role: SpaceMemberRole;
};

type KnowledgeSpaceModel = Omit<KnowledgeSpaceEntity, 'members'> & {
  members?: SpaceMemberModel[];
};

const toSpaceMemberEntity = (member: SpaceMemberModel): SpaceMemberEntity => ({
  spaceId: member.spaceId,
  userId: member.userId,
  role: member.role,
});

const toKnowledgeSpaceEntity = (space: KnowledgeSpaceModel): KnowledgeSpaceEntity => ({
  id: space.id,
  name: space.name,
  description: space.description,
  visibility: space.visibility,
  status: space.status,
  ownerId: space.ownerId,
  tenantId: space.tenantId,
  createdAt: space.createdAt,
  updatedAt: space.updatedAt,
  members: space.members?.map(toSpaceMemberEntity) ?? [],
});

@Injectable()
export class KnowledgeSpaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateKnowledgeSpaceInput): Promise<KnowledgeSpaceEntity> {
    const space = await this.prisma.knowledgeSpace.create({
      data: {
        name: input.name,
        description: input.description,
        visibility: input.visibility ?? 'PRIVATE',
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

  async listForUser(userId: string): Promise<KnowledgeSpaceEntity[]> {
    const spaces = await this.prisma.knowledgeSpace.findMany({
      where: {
        status: {
          not: 'DELETED',
        },
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

  async findAccessibleById(spaceId: string, userId: string): Promise<KnowledgeSpaceEntity | null> {
    const space = await this.prisma.knowledgeSpace.findFirst({
      where: {
        id: spaceId,
        status: {
          not: 'DELETED',
        },
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

  async update(spaceId: string, input: UpdateKnowledgeSpaceInput): Promise<KnowledgeSpaceEntity> {
    const space = await this.prisma.knowledgeSpace.update({
      where: {
        id: spaceId,
      },
      data: input,
      include: {
        members: true,
      },
    });

    return toKnowledgeSpaceEntity(space);
  }
}
