import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthModule } from '../auth';
import { EnterpriseModule } from '../enterprise';
import { UserModule } from '../user';
import { KnowledgeSpaceController } from './knowledge-space.controller';
import { KnowledgeSpaceRepository } from './knowledge-space.repository';
import { KnowledgeSpaceService } from './knowledge-space.service';

@Module({
  imports: [AuthModule, EnterpriseModule, PrismaModule, RequestContextModule, UserModule],
  controllers: [KnowledgeSpaceController],
  providers: [KnowledgeSpaceRepository, KnowledgeSpaceService],
  exports: [KnowledgeSpaceRepository, KnowledgeSpaceService],
})
export class KnowledgeSpaceModule {}
