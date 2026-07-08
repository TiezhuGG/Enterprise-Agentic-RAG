import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { AgentModule } from './modules/agent';
import { AuthModule } from './modules/auth';
import { ChatModule } from './modules/chat';
import { ChunkModule } from './modules/chunk';
import { ConversationModule } from './modules/conversation';
import { DocumentModule } from './modules/document';
import { DocumentProcessingModule } from './modules/document-processing';
import { EmbeddingModule } from './modules/embedding';
import { KnowledgeSpaceModule } from './modules/knowledge-space';
import { KnowledgeGraphModule } from './modules/knowledge-graph';
import { MemoryModule } from './modules/memory';
import { RerankerModule } from './modules/reranker';
import { RetrievalModule } from './modules/retrieval';
import { UploadModule } from './modules/upload';
import { UserModule } from './modules/user';

@Module({
  imports: [
    ConfigModule,
    AgentModule,
    AuthModule,
    UserModule,
    ConversationModule,
    MemoryModule,
    ChatModule,
    KnowledgeGraphModule,
    KnowledgeSpaceModule,
    DocumentModule,
    DocumentProcessingModule,
    ChunkModule,
    EmbeddingModule,
    RerankerModule,
    RetrievalModule,
    UploadModule,
  ],
})
export class AppModule {}
