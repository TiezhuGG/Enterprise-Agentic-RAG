import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma';
import { ChunkRepository } from './chunk.repository';
import { ChunkService } from './chunk.service';
import { MarkdownHeaderSplitter } from './splitters/markdown-header.splitter';
import { TokenSplitter } from './splitters/token.splitter';

@Module({
  imports: [PrismaModule],
  providers: [ChunkRepository, ChunkService, MarkdownHeaderSplitter, TokenSplitter],
  exports: [ChunkRepository, ChunkService],
})
export class ChunkModule {}
