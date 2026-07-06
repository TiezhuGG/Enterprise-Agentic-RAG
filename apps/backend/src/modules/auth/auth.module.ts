import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthRepository } from './auth.repository';

@Module({
  imports: [PrismaModule],
  providers: [AuthRepository],
  exports: [AuthRepository],
})
export class AuthModule {}
