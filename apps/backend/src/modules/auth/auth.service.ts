import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { ConfigService } from '../../config';
import { UserRepository, type UserRecord } from '../user';
import type { AuthenticatedUser, JwtPayload, LoginResponse } from './auth.types';
import { AuthRepository } from './auth.repository';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { CreateGovernanceUserDto } from './dto/create-governance-user.dto';
import type { LoginDto } from './dto/login.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { UpdateGovernanceUserDto } from './dto/update-governance-user.dto';
import type { ExecutionContext } from '../../common';

const unique = (values: string[]): string[] => [...new Set(values)];

const toEnterpriseMetadata = (user: UserRecord) => ({
  enterprise: {
    department: user?.department
      ? {
          code: user.department.code,
          id: user.department.id,
          name: user.department.name,
        }
      : null,
    organization: user?.organization
      ? {
          code: user.organization.code,
          id: user.organization.id,
          name: user.organization.name,
        }
      : null,
    tenant: user?.tenant
      ? {
          code: user.tenant.code,
          id: user.tenant.id,
          name: user.tenant.name,
        }
      : null,
  },
});

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async login(input: LoginDto): Promise<LoginResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user?.passwordHash || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await compare(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueLogin(user);
  }

  async createGovernanceUser(
    context: ExecutionContext,
    input: CreateGovernanceUserDto,
  ): Promise<void> {
    const tenantId = this.requireTenantId(context);
    let user: UserRecord;
    try {
      user = await this.userRepository.createGovernanceUser({
        departmentId: input.departmentId,
        email: input.email.trim().toLowerCase(),
        name: input.name.trim(),
        passwordHash: await hash(input.temporaryPassword, 10),
        tenantId,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to create user',
      );
    }
    await this.userRepository.replaceSystemRole(user.id, input.systemRole);
    await this.authRepository.recordGovernanceAudit({
      action: 'user.created',
      actorUserId: context.userId,
      after: { departmentId: user.departmentId, email: user.email, role: input.systemRole },
      targetId: user.id,
      targetType: 'user',
      tenantId,
    });
  }

  async updateGovernanceUser(
    context: ExecutionContext,
    userId: string,
    input: UpdateGovernanceUserDto,
  ): Promise<void> {
    const tenantId = this.requireTenantId(context);
    const existing = await this.userRepository.findById(userId);
    if (!existing || existing.tenantId !== tenantId) throw new NotFoundException('User not found');
    const isAdmin = existing.roles.some((role) => role.code === 'admin');
    const removesLastAdmin = isAdmin && (input.isActive === false || input.systemRole === 'user');
    if (removesLastAdmin && (await this.userRepository.countActiveTenantAdmins(tenantId)) <= 1) {
      throw new ForbiddenException(
        'The last active system administrator cannot be disabled or downgraded',
      );
    }

    let updated: UserRecord;
    try {
      updated = await this.userRepository.updateGovernanceUser(userId, {
        departmentId: input.departmentId,
        isActive: input.isActive,
        name: input.name?.trim(),
        tenantId,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unable to update user',
      );
    }
    if (input.systemRole) await this.userRepository.replaceSystemRole(userId, input.systemRole);
    await this.authRepository.recordGovernanceAudit({
      action: 'user.updated',
      actorUserId: context.userId,
      after: {
        departmentId: updated.departmentId,
        isActive: updated.isActive,
        role: input.systemRole ?? existing.roles[0]?.code,
      },
      before: {
        departmentId: existing.departmentId,
        isActive: existing.isActive,
        role: existing.roles[0]?.code,
      },
      targetId: userId,
      targetType: 'user',
      tenantId,
    });
  }

  async resetGovernanceUserPassword(
    context: ExecutionContext,
    userId: string,
    input: ResetPasswordDto,
  ): Promise<void> {
    const tenantId = this.requireTenantId(context);
    const user = await this.userRepository.findById(userId);
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('User not found');
    await this.userRepository.updatePassword(userId, await hash(input.temporaryPassword, 10), true);
    await this.authRepository.recordGovernanceAudit({
      action: 'user.password_reset',
      actorUserId: context.userId,
      targetId: userId,
      targetType: 'user',
      tenantId,
    });
  }

  async changePassword(
    context: ExecutionContext,
    input: ChangePasswordDto,
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findById(context.userId);
    if (!user?.passwordHash || !(await compare(input.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (input.currentPassword === input.newPassword) {
      throw new BadRequestException(
        'Choose a new password that differs from the temporary password',
      );
    }
    await this.userRepository.updatePassword(user.id, await hash(input.newPassword, 10), false);
    const refreshed = await this.userRepository.findById(user.id);
    if (!refreshed) throw new NotFoundException('User not found');
    return this.issueLogin(refreshed);
  }

  private async issueLogin(user: UserRecord): Promise<LoginResponse> {
    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.code),
      permissions: unique(user.roles.flatMap((role) => role.permissions)),
      spaceIds: user.spaceIds,
      tenantId: user.tenantId ?? undefined,
      organizationId: user.organizationId ?? undefined,
      departmentId: user.departmentId ?? undefined,
      mustChangePassword: user.mustChangePassword,
      metadata: toEnterpriseMetadata(user),
    };
    const payload: JwtPayload = {
      sub: authUser.id,
      email: authUser.email,
      roles: authUser.roles,
      permissions: authUser.permissions,
      spaceIds: authUser.spaceIds,
      tenantId: authUser.tenantId,
      organizationId: authUser.organizationId,
      departmentId: authUser.departmentId,
      mustChangePassword: authUser.mustChangePassword,
      metadata: authUser.metadata,
    };
    const { expiresIn } = this.configService.getJwtConfig();
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: authUser,
    };
  }

  getCurrentUser(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  private requireTenantId(context: ExecutionContext): string {
    if (!context.tenantId) throw new BadRequestException('An enterprise tenant is required');
    return context.tenantId;
  }
}
