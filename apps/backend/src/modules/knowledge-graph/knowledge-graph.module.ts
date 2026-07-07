import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { GraphModule } from '../../infrastructure/graph';
import { ChunkModule } from '../chunk';
import { LLM_PROVIDER } from '../chat/providers/llm.provider';
import { OpenAiCompatibleLlmProvider } from '../chat/providers/openai-compatible.provider';
import { DocumentModule } from '../document';
import { EntityExtractor } from './extractors/entity.extractor';
import { RelationExtractor } from './extractors/relation.extractor';
import { GraphRetrievalService } from './graph-retrieval.service';
import { KnowledgeGraphRepository } from './knowledge-graph.repository';
import { KnowledgeGraphService } from './knowledge-graph.service';
import { GRAPH_PROVIDER, LlmGraphProvider } from './providers/llm-graph.provider';

@Module({
  imports: [ChunkModule, ConfigModule, DocumentModule, GraphModule],
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
