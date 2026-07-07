import { Injectable } from '@nestjs/common';
import type { ContextChunk } from '../../retrieval';
import type { ChatMessage } from '../chat.types';
import { buildUserPrompt, systemPrompt } from './prompt.templates';

@Injectable()
export class PromptBuilder {
  build(question: string, contextChunks: ContextChunk[]): ChatMessage[] {
    return [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: buildUserPrompt(question, this.formatContext(contextChunks)),
      },
    ];
  }

  private formatContext(contextChunks: ContextChunk[]): string {
    if (contextChunks.length === 0) {
      return 'No relevant context found.';
    }

    return contextChunks
      .map(
        (chunk, index) => `[${index + 1}]
chunkId: ${chunk.chunkId}
documentId: ${chunk.documentId}
score: ${chunk.score}
sectionTitle: ${chunk.metadata.sectionTitle}
content:
${chunk.content}`,
      )
      .join('\n\n');
  }
}
