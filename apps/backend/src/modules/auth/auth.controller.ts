import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { AuthService } from './auth.service';
import type { AuthenticatedUser, LoginResponse } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Permissions } from './decorators/permissions.decorator';
import { Roles } from './decorators/roles.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return this.authService.getCurrentUser(user);
  }

  @Get('context')
  @Roles('admin')
  @Permissions('user.read')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  getContext(@CurrentUser() user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
