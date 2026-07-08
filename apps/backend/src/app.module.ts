import { Module } from '@nestjs/common';
import { ConfigModule } from './config';
import { ObservabilityModule } from './infrastructure/observability';
import { ReadinessModule } from './infrastructure/observability/readiness.module';
import { AgentModule } from './modules/agent';
import { AuthModule } from './modules/auth';
import { ChatModule } from './modules/chat';
import { ChunkModule } from './modules/chunk';
import { ConversationModule } from './modules/conversation';
import { DocumentModule } from './modules/document';
import { DocumentProcessingModule } from './modules/document-processing';
import { EmbeddingModule } from './modules/embedding';
import { EvaluationModule } from './modules/evaluation';
import { ExecutionModule } from './modules/execution';
import { IngestionModule } from './modules/ingestion';
import { KnowledgeSpaceModule } from './modules/knowledge-space';
import { KnowledgeGraphModule } from './modules/knowledge-graph';
import { MemoryModule } from './modules/memory';
import { MultimodalModule } from './modules/multimodal';
import { PipelineModule } from './modules/pipeline';
import { RerankerModule } from './modules/reranker';
import { RetrievalModule } from './modules/retrieval';
import { UploadModule } from './modules/upload';
import { UserModule } from './modules/user';

@Module({
  imports: [
    ConfigModule,
    ObservabilityModule,
    ReadinessModule,
    AgentModule,
    AuthModule,
    UserModule,
    ConversationModule,
    MemoryModule,
    MultimodalModule,
    ChatModule,
    KnowledgeGraphModule,
    KnowledgeSpaceModule,
    DocumentModule,
    DocumentProcessingModule,
    ChunkModule,
    EmbeddingModule,
    IngestionModule,
    EvaluationModule,
    ExecutionModule,
    PipelineModule,
    RerankerModule,
    RetrievalModule,
    UploadModule,
  ],
})
export class AppModule {}
