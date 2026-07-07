import { Module } from '@nestjs/common';
import { VectorModule } from '../../infrastructure/vector';
import { ChunkModule } from '../chunk';
import { EmbeddingModule } from '../embedding';
import { RerankerModule } from '../reranker';
import { ContextBuilder } from './context/context.builder';
import { RrfFusion } from './fusion/rrf.fusion';
import { KeywordRetriever } from './retrievers/keyword.retriever';
import { VectorRetriever } from './retrievers/vector.retriever';
import { RetrievalService } from './retrieval.service';

@Module({
  imports: [ChunkModule, EmbeddingModule, RerankerModule, VectorModule],
  providers: [ContextBuilder, KeywordRetriever, RetrievalService, RrfFusion, VectorRetriever],
  exports: [RetrievalService],
})
export class RetrievalModule {}
