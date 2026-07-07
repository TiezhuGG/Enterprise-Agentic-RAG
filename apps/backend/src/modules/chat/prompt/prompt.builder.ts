import { Injectable } from '@nestjs/common';
import type { ContextChunk } from '../../retrieval';
import type { ChatHistoryMessage, ChatMessage } from '../chat.types';
import { buildUserPrompt, systemPrompt } from './prompt.templates';

@Injectable()
export class PromptBuilder {
  build(
    question: string,
    contextChunks: ContextChunk[],
    historyMessages: ChatHistoryMessage[] = [],
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: buildUserPrompt({
          history: this.formatHistory(historyMessages),
          context: this.formatContext(contextChunks),
          question,
        }),
      },
    ];
  }

  private formatHistory(historyMessages: ChatHistoryMessage[]): string {
    if (historyMessages.length === 0) {
      return 'No previous messages.';
    }

    return historyMessages
      .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
      .join('\n');
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
