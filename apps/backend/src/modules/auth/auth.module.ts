import { JwtModule, type JwtModuleOptions } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '../../config';
import { PrismaModule } from '../../infrastructure/prisma';
import { UserModule } from '../user';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const { secret, expiresIn } = configService.getJwtConfig();

        return {
          secret,
          signOptions: {
            expiresIn,
          } as JwtModuleOptions['signOptions'],
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthRepository, AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthRepository, AuthService, JwtAuthGuard],
})
export class AuthModule {}
