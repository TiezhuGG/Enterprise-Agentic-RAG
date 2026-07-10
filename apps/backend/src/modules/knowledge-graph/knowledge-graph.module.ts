import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { ConfigModule } from '../../config';
import { GraphModule } from '../../infrastructure/graph';
import { AccessPolicyModule } from '../access-policy';
import { AuthModule } from '../auth';
import { ChunkModule } from '../chunk';
import { LLM_PROVIDER } from '../chat/providers/llm.provider';
import { OpenAiCompatibleLlmProvider } from '../chat/providers/openai-compatible.provider';
import { DocumentModule } from '../document';
import { KnowledgeSpaceModule } from '../knowledge-space';
import { EntityExtractor } from './extractors/entity.extractor';
import { RelationExtractor } from './extractors/relation.extractor';
import { GraphRetrievalService } from './graph-retrieval.service';
import { KnowledgeGraphController } from './knowledge-graph.controller';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { GRAPH_PROVIDER, LlmGraphProvider } from './providers/llm-graph.provider';

@Module({
  imports: [
    AccessPolicyModule,
    AuthModule,
    ChunkModule,
    ConfigModule,
    DocumentModule,
    GraphModule,
    KnowledgeSpaceModule,
    RequestContextModule,
  ],
  controllers: [KnowledgeGraphController],
  providers: [
    EntityExtractor,
    GraphRetrievalService,
    KnowledgeGraphRepository,
    KnowledgeGraphService,
    RelationExtractor,
    {
      provide: LLM_PROVIDER,
      useClass: OpenAiCompatibleLlmProvider,
    },
    {
      provide: GRAPH_PROVIDER,
      useClass: LlmGraphProvider,
    },
  ],
  exports: [GraphRetrievalService, KnowledgeGraphService],
})
export class KnowledgeGraphModule {}
