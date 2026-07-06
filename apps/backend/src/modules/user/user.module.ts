import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma';
import { UserRepository } from './user.repository';

@Module({
  imports: [PrismaModule],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class UserModule {}
