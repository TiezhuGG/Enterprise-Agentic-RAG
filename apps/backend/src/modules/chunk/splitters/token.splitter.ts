import { BadRequestException, Injectable } from '@nestjs/common';
import {
  defaultChunkOverlapTokens,
  defaultChunkSizeTokens,
  type ChunkOptions,
  type MarkdownSection,
  type TokenSplitChunk,
} from '../chunk.types';

const tokenPattern =
  /(\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}|[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*|[^\sA-Za-z0-9])\s*/gu;

@Injectable()
export class TokenSplitter {
  splitSections(
    sections: MarkdownSection[],
    options: ChunkOptions = {
      chunkSize: defaultChunkSizeTokens,
      overlap: defaultChunkOverlapTokens,
    },
  ): TokenSplitChunk[] {
    this.validateOptions(options);

    return sections.flatMap((section) => this.splitSection(section, options));
  }

  countTokens(content: string): number {
    return this.tokenize(content).length;
  }

  private splitSection(section: MarkdownSection, options: ChunkOptions): TokenSplitChunk[] {
    const tokens = this.tokenize(section.content);

    if (tokens.length <= options.chunkSize) {
      return [
        {
          sectionTitle: section.sectionTitle,
          content: section.content,
          tokenCount: tokens.length,
        },
      ];
    }

    const chunks: TokenSplitChunk[] = [];
    const step = options.chunkSize - options.overlap;

    for (let start = 0; start < tokens.length; start += step) {
      const end = Math.min(start + options.chunkSize, tokens.length);
      const content = tokens.slice(start, end).join('').trim();

      if (content) {
        chunks.push({
          sectionTitle: section.sectionTitle,
          content,
          tokenCount: end - start,
        });
      }

      if (end === tokens.length) {
        break;
      }
    }

    return chunks;
  }

  private tokenize(content: string): string[] {
    return Array.from(content.matchAll(tokenPattern), (match) => match[0]);
  }

  private validateOptions(options: ChunkOptions): void {
    if (options.chunkSize <= 0) {
      throw new BadRequestException('Chunk size must be greater than zero');
    }

    if (options.overlap < 0) {
      throw new BadRequestException('Chunk overlap must be zero or greater');
    }

    if (options.overlap >= options.chunkSize) {
      throw new BadRequestException('Chunk overlap must be smaller than chunk size');
    }
  }
}
