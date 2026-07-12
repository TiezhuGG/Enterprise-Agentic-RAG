import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { StorageModule } from '../../infrastructure/storage';
import { AuthModule } from '../auth';
import { DocumentModule } from '../document';
import { IngestionModule } from '../ingestion';
import { KnowledgeSpaceModule } from '../knowledge-space';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    AuthModule,
    DocumentModule,
    IngestionModule,
    KnowledgeSpaceModule,
    RequestContextModule,
    StorageModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
