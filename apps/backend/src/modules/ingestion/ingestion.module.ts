import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { PrismaModule } from '../../infrastructure/prisma';
import { AuthModule } from '../auth';
import { ChunkModule } from '../chunk';
import { DocumentModule } from '../document';
import { DocumentProcessingModule } from '../document-processing';
import { EmbeddingModule } from '../embedding';
import { KnowledgeGraphModule } from '../knowledge-graph';
import { PipelineModule } from '../pipeline';
import { IngestionController } from './ingestion.controller';
import { IngestionRepository } from './ingestion.repository';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    AuthModule,
    ChunkModule,
    DocumentModule,
    DocumentProcessingModule,
    EmbeddingModule,
    KnowledgeGraphModule,
    PipelineModule,
    PrismaModule,
    RequestContextModule,
  ],
  controllers: [IngestionController],
  providers: [IngestionRepository, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
