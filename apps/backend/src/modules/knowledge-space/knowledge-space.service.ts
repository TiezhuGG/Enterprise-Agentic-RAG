import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import type { KnowledgeSpaceEntity, SpaceMemberRole } from './entities/knowledge-space.entity';
import type { CreateKnowledgeSpaceDto } from './dto/create-knowledge-space.dto';
import type { UpdateKnowledgeSpaceDto } from './dto/update-knowledge-space.dto';
import { KnowledgeSpaceRepository } from './knowledge-space.repository';

const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];

@Injectable()
export class KnowledgeSpaceService {
  constructor(private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository) {}

  async create(
    context: ExecutionContext,
    input: CreateKnowledgeSpaceDto,
  ): Promise<KnowledgeSpaceEntity> {
    return this.knowledgeSpaceRepository.create({
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      ownerId: context.userId,
    });
  }

  list(context: ExecutionContext): Promise<KnowledgeSpaceEntity[]> {
    return this.knowledgeSpaceRepository.listForUser(context.userId);
  }

  async getById(context: ExecutionContext, id: string): Promise<KnowledgeSpaceEntity> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(id, context.userId);

    if (!space) {
      throw new NotFoundException('Knowledge space not found');
    }

    return space;
  }

  async update(
    context: ExecutionContext,
    id: string,
    input: UpdateKnowledgeSpaceDto,
  ): Promise<KnowledgeSpaceEntity> {
    await this.ensureMemberRole(context, id, input.status === 'DELETED' ? ['OWNER'] : writeRoles);

    return this.knowledgeSpaceRepository.update(id, input);
  }

  async delete(context: ExecutionContext, id: string): Promise<KnowledgeSpaceEntity> {
    await this.ensureMemberRole(context, id, ['OWNER']);

    return this.knowledgeSpaceRepository.update(id, {
      status: 'DELETED',
    });
  }

  private async ensureMemberRole(
    context: ExecutionContext,
    spaceId: string,
    allowedRoles: SpaceMemberRole[],
  ): Promise<void> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(spaceId, context.userId);

    if (!space) {
      throw new NotFoundException('Knowledge space not found');
    }

    const member = space.members.find((spaceMember) => spaceMember.userId === context.userId);

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }
  }
}
