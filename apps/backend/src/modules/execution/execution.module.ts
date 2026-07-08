import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthModule } from '../auth';
import { ExecutionController } from './execution.controller';
import { ExecutionRepository } from './execution.repository';
import { ExecutionService } from './execution.service';

@Module({
  imports: [AuthModule, PrismaModule, RequestContextModule],
  controllers: [ExecutionController],
  providers: [ExecutionRepository, ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
