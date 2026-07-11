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
import { EnterpriseModule } from './modules/enterprise';
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
import { TaxonomyModule } from './modules/taxonomy';
import { UploadModule } from './modules/upload';
import { UserModule } from './modules/user';
import { SearchModule as InfrastructureSearchModule } from './infrastructure/search';
import { KnowledgeSearchModule } from './modules/search';

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
    EnterpriseModule,
    IngestionModule,
    EvaluationModule,
    ExecutionModule,
    PipelineModule,
    RerankerModule,
    RetrievalModule,
    InfrastructureSearchModule,
    KnowledgeSearchModule,
    TaxonomyModule,
    UploadModule,
  ],
})
export class AppModule {}
