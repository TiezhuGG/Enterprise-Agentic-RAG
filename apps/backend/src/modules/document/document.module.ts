import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { StorageModule } from '../../infrastructure/storage';
import { AccessPolicyModule } from '../access-policy';
import { AuthModule } from '../auth';
import { KnowledgeSpaceModule } from '../knowledge-space';
import { DocumentController } from './document.controller';
import { DocumentRepository } from './document.repository';
import { DocumentService } from './document.service';

@Module({
  imports: [
    AccessPolicyModule,
    AuthModule,
    KnowledgeSpaceModule,
    PrismaModule,
    RequestContextModule,
    StorageModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentRepository, DocumentService],
  exports: [DocumentRepository, DocumentService],
})
export class DocumentModule {}
