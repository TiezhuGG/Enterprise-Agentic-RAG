import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { AuthModule } from './modules/auth';
import { ChunkModule } from './modules/chunk';
import { DocumentModule } from './modules/document';
import { DocumentProcessingModule } from './modules/document-processing';
import { EmbeddingModule } from './modules/embedding';
import { KnowledgeSpaceModule } from './modules/knowledge-space';
import { UploadModule } from './modules/upload';
import { UserModule } from './modules/user';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UserModule,
    KnowledgeSpaceModule,
    DocumentModule,
    DocumentProcessingModule,
    ChunkModule,
    EmbeddingModule,
    UploadModule,
  ],
})
export class AppModule {}
