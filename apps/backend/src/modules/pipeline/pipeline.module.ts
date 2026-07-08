import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthModule } from '../auth';
import { DocumentModule } from '../document';
import { KnowledgeSpaceModule } from '../knowledge-space';
import { PipelineController } from './pipeline.controller';
import { PipelineRepository } from './pipeline.repository';
import { PipelineService } from './pipeline.service';

@Module({
  imports: [AuthModule, DocumentModule, KnowledgeSpaceModule, PrismaModule, RequestContextModule],
  controllers: [PipelineController],
  providers: [PipelineRepository, PipelineService],
  exports: [PipelineService],
})
export class PipelineModule {}
