import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { UserRepository, type UserRecord } from '../user';
import type {
  KnowledgeSpaceEntity,
  SpaceMemberDetailEntity,
  SpaceMemberEntity,
  SpaceMemberRole,
} from './entities/knowledge-space.entity';
import type { AddSpaceMemberDto } from './dto/add-space-member.dto';
import type { CreateKnowledgeSpaceDto } from './dto/create-knowledge-space.dto';
import type { UpdateSpaceMemberDto } from './dto/update-space-member.dto';
import type { UpdateKnowledgeSpaceDto } from './dto/update-knowledge-space.dto';
import { KnowledgeSpaceRepository } from './knowledge-space.repository';

const readRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR', 'VIEWER'];
const writeRoles: SpaceMemberRole[] = ['OWNER', 'EDITOR'];

@Injectable()
export class KnowledgeSpaceService {
  constructor(
    private readonly knowledgeSpaceRepository: KnowledgeSpaceRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(
    context: ExecutionContext,
    input: CreateKnowledgeSpaceDto,
  ): Promise<KnowledgeSpaceEntity> {
    return this.knowledgeSpaceRepository.create({
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      ownerId: context.userId,
      tenantId: context.tenantId,
    });
  }

  list(context: ExecutionContext): Promise<KnowledgeSpaceEntity[]> {
    return this.knowledgeSpaceRepository.listForUser(context.userId, context.tenantId);
  }

  async getById(context: ExecutionContext, id: string): Promise<KnowledgeSpaceEntity> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(
      id,
      context.userId,
      context.tenantId,
    );

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

  async listMembers(
    context: ExecutionContext,
    spaceId: string,
  ): Promise<SpaceMemberDetailEntity[]> {
    await this.ensureMemberRole(context, spaceId, readRoles);

    return this.knowledgeSpaceRepository.listMembers(spaceId);
  }

  async addMember(
    context: ExecutionContext,
    spaceId: string,
    input: AddSpaceMemberDto,
  ): Promise<SpaceMemberDetailEntity[]> {
    const { space } = await this.ensureMemberRole(context, spaceId, ['OWNER']);
    const targetUser = await this.userRepository.findByEmail(input.email.trim().toLowerCase());

    if (!targetUser || !targetUser.isActive) {
      throw new NotFoundException('User not found');
    }

    this.assertSameTenant(space.tenantId, targetUser);
    const existingMember = await this.knowledgeSpaceRepository.findMember(spaceId, targetUser.id);

    if (existingMember?.role === 'OWNER' && input.role !== 'OWNER') {
      await this.assertNotLastOwner(spaceId);
    }

    await this.knowledgeSpaceRepository.upsertMember(spaceId, targetUser.id, input.role);

    return this.knowledgeSpaceRepository.listMembers(spaceId);
  }

  async updateMember(
    context: ExecutionContext,
    spaceId: string,
    userId: string,
    input: UpdateSpaceMemberDto,
  ): Promise<SpaceMemberDetailEntity[]> {
    await this.ensureMemberRole(context, spaceId, ['OWNER']);
    const targetMember = await this.findMemberOrThrow(spaceId, userId);

    if (targetMember.role === 'OWNER' && input.role !== 'OWNER') {
      await this.assertNotLastOwner(spaceId);
    }

    await this.knowledgeSpaceRepository.updateMemberRole(spaceId, userId, input.role);

    return this.knowledgeSpaceRepository.listMembers(spaceId);
  }

  async removeMember(
    context: ExecutionContext,
    spaceId: string,
    userId: string,
  ): Promise<SpaceMemberDetailEntity[]> {
    await this.ensureMemberRole(context, spaceId, ['OWNER']);
    const targetMember = await this.findMemberOrThrow(spaceId, userId);

    if (targetMember.role === 'OWNER') {
      await this.assertNotLastOwner(spaceId);
    }

    await this.knowledgeSpaceRepository.deleteMember(spaceId, userId);

    return this.knowledgeSpaceRepository.listMembers(spaceId);
  }

  listAccessibleSpaceIds(context: ExecutionContext): Promise<string[]> {
    return this.knowledgeSpaceRepository.listAccessibleSpaceIds(context.userId, context.tenantId);
  }

  private async ensureMemberRole(
    context: ExecutionContext,
    spaceId: string,
    allowedRoles: SpaceMemberRole[],
  ): Promise<{ memberRole: SpaceMemberRole; space: KnowledgeSpaceEntity }> {
    const space = await this.knowledgeSpaceRepository.findAccessibleById(
      spaceId,
      context.userId,
      context.tenantId,
    );

    if (!space) {
      throw new NotFoundException('Knowledge space not found');
    }

    const member = space.members.find((spaceMember) => spaceMember.userId === context.userId);

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient knowledge space role');
    }

    return {
      memberRole: member.role,
      space,
    };
  }

  private assertSameTenant(spaceTenantId: string | null, user: UserRecord): void {
    if ((spaceTenantId ?? null) !== (user.tenantId ?? null)) {
      throw new ForbiddenException('User belongs to another tenant');
    }
  }

  private async findMemberOrThrow(spaceId: string, userId: string): Promise<SpaceMemberEntity> {
    const member = await this.knowledgeSpaceRepository.findMember(spaceId, userId);

    if (!member) {
      throw new NotFoundException('Space member not found');
    }

    return member;
  }

  private async assertNotLastOwner(spaceId: string): Promise<void> {
    const ownerCount = await this.knowledgeSpaceRepository.countOwners(spaceId);

    if (ownerCount <= 1) {
      throw new BadRequestException('Cannot remove or downgrade the last OWNER');
    }
  }
}
