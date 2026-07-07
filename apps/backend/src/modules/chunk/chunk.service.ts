import { Injectable, NotFoundException } from '@nestjs/common';
import { ChunkRepository } from './chunk.repository';
import { type ChunkEntity } from './chunk.entity';
import { defaultChunkOverlapTokens, defaultChunkSizeTokens } from './chunk.types';
import { MarkdownHeaderSplitter } from './splitters/markdown-header.splitter';
import { TokenSplitter } from './splitters/token.splitter';

@Injectable()
export class ChunkService {
  constructor(
    private readonly chunkRepository: ChunkRepository,
    private readonly markdownHeaderSplitter: MarkdownHeaderSplitter,
    private readonly tokenSplitter: TokenSplitter,
  ) {}

  async processChunks(documentId: string): Promise<ChunkEntity[]> {
    const documentContent = await this.chunkRepository.findDocumentContentByDocumentId(documentId);

    if (!documentContent) {
      throw new NotFoundException('Document content not found');
    }

    await this.chunkRepository.deleteByDocumentId(documentId);

    const sections = this.markdownHeaderSplitter.split(documentContent.content);
    const splitChunks = this.tokenSplitter.splitSections(sections, {
      chunkSize: defaultChunkSizeTokens,
      overlap: defaultChunkOverlapTokens,
    });

    const chunks = splitChunks.map((chunk, index) => ({
      documentId,
      content: chunk.content,
      sequence: index + 1,
      tokenCount: this.tokenSplitter.countTokens(chunk.content),
      metadata: {
        documentId,
        sequence: index + 1,
        sectionTitle: chunk.sectionTitle,
      },
    }));

    return this.chunkRepository.createMany(chunks);
  }
}
