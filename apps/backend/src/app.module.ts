import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { AuthModule } from './modules/auth';
import { DocumentModule } from './modules/document';
import { KnowledgeSpaceModule } from './modules/knowledge-space';
import { UserModule } from './modules/user';

@Module({
  imports: [ConfigModule, AuthModule, UserModule, KnowledgeSpaceModule, DocumentModule],
})
export class AppModule {}
