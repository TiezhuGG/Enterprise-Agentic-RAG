import { Module } from '@nestjs/common';
import { VectorModule } from '../../infrastructure/vector';
import { SearchModule } from '../../infrastructure/search';
import { AccessPolicyModule } from '../access-policy';
import { ChunkModule } from '../chunk';
import { DocumentModule } from '../document';
import { EmbeddingModule } from '../embedding';
import { KnowledgeGraphModule } from '../knowledge-graph';
import { KnowledgeSpaceModule } from '../knowledge-space';
import { RerankerModule } from '../reranker';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { GraphRetriever } from './retrievers/graph.retriever';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [
    AccessPolicyModule,
    ChunkModule,
    DocumentModule,
    EmbeddingModule,
    KnowledgeGraphModule,
    KnowledgeSpaceModule,
    RerankerModule,
    SearchModule,
    VectorModule,
  ],
  providers: [
    ContextBuilder,
    GraphRetriever,
    KeywordRetriever,
    RetrievalService,
    RrfFusion,
    VectorRetriever,
  ],
  exports: [ContextBuilder, RetrievalService],
})
export class RetrievalModule {}
