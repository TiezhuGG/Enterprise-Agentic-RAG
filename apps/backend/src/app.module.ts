import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { ObservabilityModule } from './infrastructure/observability';
import { AgentModule } from './modules/agent';
import { AuthModule } from './modules/auth';
import { ChatModule } from './modules/chat';
import { ChunkModule } from './modules/chunk';
import { ConversationModule } from './modules/conversation';
import { DocumentModule } from './modules/document';
import { DocumentProcessingModule } from './modules/document-processing';
import { EmbeddingModule } from './modules/embedding';
import { EvaluationModule } from './modules/evaluation';
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
    ObservabilityModule,
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
    EvaluationModule,
    RerankerModule,
    RetrievalModule,
    UploadModule,
  ],
})
export class AppModule {}
