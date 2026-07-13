import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { AuthService } from './auth.service';
import {
  AuthRepository,
  type AuthorizationAuditRole,
  type AuthorizationAuditUser,
} from './auth.repository';
import type { AuthenticatedUser, LoginResponse } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Permissions } from './decorators/permissions.decorator';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateGovernanceUserDto } from './dto/create-governance-user.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateGovernanceUserDto } from './dto/update-governance-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authRepository: AuthRepository,
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

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: ChangePasswordDto,
  ): Promise<LoginResponse> {
    return this.authService.changePassword(this.requestContextService.create(user), input);
  }

  @Get('governance/users')
  @Roles('admin')
  @Permissions('user.read')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  listGovernanceUsers(@CurrentUser() user: AuthenticatedUser): Promise<AuthorizationAuditUser[]> {
    return this.authRepository.listAuthorizationAuditUsers(user.tenantId);
  }

  @Get('governance/roles')
  @Roles('admin')
  @Permissions('user.read')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  listGovernanceRoles(): Promise<AuthorizationAuditRole[]> {
    return this.authRepository.listAuthorizationAuditRoles();
  }

  @Post('governance/users')
  @Roles('admin')
  @Permissions('user.write', 'role.manage')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  createGovernanceUser(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateGovernanceUserDto,
  ): Promise<void> {
    return this.authService.createGovernanceUser(this.requestContextService.create(user), input);
  }

  @Patch('governance/users/:id')
  @Roles('admin')
  @Permissions('user.write', 'role.manage')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  updateGovernanceUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() input: UpdateGovernanceUserDto,
  ): Promise<void> {
    return this.authService.updateGovernanceUser(
      this.requestContextService.create(user),
      userId,
      input,
    );
  }

  @Post('governance/users/:id/reset-password')
  @Roles('admin')
  @Permissions('user.write')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  resetGovernanceUserPassword(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') userId: string,
    @Body() input: ResetPasswordDto,
  ): Promise<void> {
    return this.authService.resetGovernanceUserPassword(
      this.requestContextService.create(user),
      userId,
      input,
    );
  }

  @Get('context')
  @Roles('admin')
  @Permissions('user.read')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  getContext(@CurrentUser() user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
