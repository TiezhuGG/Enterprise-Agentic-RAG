import { UnauthorizedException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { ConfigService } from '../../config';
import { UserRepository } from '../user';
import type { AuthenticatedUser, JwtPayload, LoginResponse } from './auth.types';
import type { LoginDto } from './dto/login.dto';

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
    };
    const payload: JwtPayload = {
      sub: authUser.id,
      email: authUser.email,
      roles: authUser.roles,
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
