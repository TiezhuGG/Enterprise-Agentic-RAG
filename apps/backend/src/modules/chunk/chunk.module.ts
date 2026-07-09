import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma';
import { SearchModule } from '../../infrastructure/search';
import { ChunkRepository } from './chunk.repository';
import { ChunkService } from './chunk.service';
import { MarkdownHeaderSplitter } from './splitters/markdown-header.splitter';
import { TokenSplitter } from './splitters/token.splitter';

@Module({
  imports: [PrismaModule, SearchModule],
  providers: [ChunkRepository, ChunkService, MarkdownHeaderSplitter, TokenSplitter],
  exports: [ChunkRepository, ChunkService],
})
export class ChunkModule {}
