import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { AuthRepository } from '../auth';
import { EnterpriseService } from '../enterprise';
import { UserRepository, type ActiveTenantUserCandidate, type UserRecord } from '../user';
import type {
  KnowledgeSpaceEntity,
  SpaceMemberDetailEntity,
  SpaceMemberEntity,
  SpaceMemberRole,
} from './entities/knowledge-space.entity';
import { normalizeKnowledgeSpaceMetadata } from './entities/knowledge-space.entity';
import type { AddSpaceMemberDto } from './dto/add-space-member.dto';
import type { AddSpaceMembersDto } from './dto/add-space-members.dto';
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
    private readonly enterpriseService: EnterpriseService,
    private readonly authRepository: AuthRepository,
  ) {}

  async create(
    context: ExecutionContext,
    input: CreateKnowledgeSpaceDto,
  ): Promise<KnowledgeSpaceEntity> {
    const department = await this.enterpriseService.getActiveDepartment(
      context,
      input.departmentId,
      input.type === 'DEPARTMENT',
    );
    const space = await this.knowledgeSpaceRepository.create({
      name: input.name,
      description: input.description,
      visibility: input.visibility,
      type: input.type,
      metadata: input.metadata ? normalizeKnowledgeSpaceMetadata(input.metadata) : undefined,
      ownerId: context.userId,
      tenantId: context.tenantId,
      departmentId: department?.id,
    });
    await this.audit(context, 'knowledge_base.created', space.id, undefined, space.departmentId ?? undefined);
    return space;
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
    const current = await this.ensureMemberRole(
      context,
      id,
      input.status === 'DELETED' || input.departmentId !== undefined || input.type !== undefined
        ? ['OWNER']
        : writeRoles,
    );
    const type = input.type ?? current.space.type;
    const requestedDepartmentId = input.departmentId === undefined
      ? current.space.departmentId ?? undefined
      : input.departmentId ?? undefined;
    const department = await this.enterpriseService.getActiveDepartment(
      context,
      requestedDepartmentId,
      type === 'DEPARTMENT',
    );

    const updated = await this.knowledgeSpaceRepository.update(id, {
      description: input.description,
      metadata: input.metadata ? normalizeKnowledgeSpaceMetadata(input.metadata) : undefined,
      name: input.name,
      status: input.status,
      type: input.type,
      visibility: input.visibility,
      departmentId: input.departmentId === undefined ? undefined : department?.id ?? null,
    });
    if (input.departmentId !== undefined) {
      await this.audit(
        context,
        'knowledge_base.department_updated',
        id,
        current.space.departmentId ?? undefined,
        updated.departmentId ?? undefined,
      );
    }
    return updated;
  }

  async delete(context: ExecutionContext, id: string): Promise<KnowledgeSpaceEntity> {
    await this.ensureMemberRole(context, id, ['OWNER']);

    const deleted = await this.knowledgeSpaceRepository.update(id, {
      status: 'DELETED',
    });
    await this.audit(context, 'knowledge_base.deleted', id, undefined, undefined);
    return deleted;
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
    await this.audit(context, 'knowledge_base.member_added', spaceId, undefined, targetUser.id);

    return this.knowledgeSpaceRepository.listMembers(spaceId);
  }

  async listMemberCandidates(
    context: ExecutionContext,
    spaceId: string,
    search?: string,
  ): Promise<ActiveTenantUserCandidate[]> {
    const { space } = await this.ensureMemberRole(context, spaceId, ['OWNER']);
    if (!space.tenantId) return [];
    return this.userRepository.listActiveTenantUserCandidates(space.tenantId, spaceId, search);
  }

  async addMembers(
    context: ExecutionContext,
    spaceId: string,
    input: AddSpaceMembersDto,
  ): Promise<SpaceMemberDetailEntity[]> {
    const { space } = await this.ensureMemberRole(context, spaceId, ['OWNER']);
    const uniqueMembers = [...new Map(input.members.map((member) => [member.userId, member])).values()];
    for (const member of uniqueMembers) {
      const targetUser = await this.userRepository.findById(member.userId);
      if (!targetUser || !targetUser.isActive) throw new NotFoundException('User not found');
      this.assertSameTenant(space.tenantId, targetUser);
      await this.knowledgeSpaceRepository.upsertMember(spaceId, targetUser.id, member.role);
    }
    await this.audit(context, 'knowledge_base.members_added', spaceId, undefined, `${uniqueMembers.length}`);
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
    await this.audit(context, 'knowledge_base.member_role_updated', spaceId, targetMember.role, input.role);

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
    await this.audit(context, 'knowledge_base.member_removed', spaceId, targetMember.role, userId);

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

  private async audit(
    context: ExecutionContext,
    action: string,
    spaceId: string,
    before: string | undefined,
    after: string | undefined,
  ): Promise<void> {
    await this.authRepository.recordGovernanceAudit({
      action,
      actorUserId: context.userId,
      after: after ? { value: after } : undefined,
      before: before ? { value: before } : undefined,
      targetId: spaceId,
      targetType: 'knowledge_base',
      tenantId: context.tenantId,
    });
  }
}
