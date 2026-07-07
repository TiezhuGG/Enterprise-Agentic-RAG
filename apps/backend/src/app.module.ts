import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { AuthModule } from './modules/auth';
import { DocumentModule } from './modules/document';
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
    UploadModule,
  ],
})
export class AppModule {}
