import { UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { ConfigService } from '../../config';
import { UserRepository, type UserRecord } from '../user';
import type { AuthenticatedUser, JwtPayload, LoginResponse } from './auth.types';
import type { LoginDto } from './dto/login.dto';

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

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      roles: user.roles.map((role) => role.code),
      permissions: unique(user.roles.flatMap((role) => role.permissions)),
      spaceIds: user.spaceIds,
      tenantId: user.tenantId ?? undefined,
      organizationId: user.organizationId ?? undefined,
      departmentId: user.departmentId ?? undefined,
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
}
