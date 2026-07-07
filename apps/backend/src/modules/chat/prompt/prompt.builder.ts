import { Injectable } from '@nestjs/common';
import type { MemoryContext } from '../../memory';
import type { ContextChunk } from '../../retrieval';
import type { ChatHistoryMessage, ChatMessage } from '../chat.types';
import { buildUserPrompt, systemPrompt } from './prompt.templates';

@Injectable()
export class PromptBuilder {
  build(
    question: string,
    contextChunks: ContextChunk[],
    historyMessages: ChatHistoryMessage[] = [],
    memoryContext?: MemoryContext,
  ): ChatMessage[] {
    return [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: buildUserPrompt({
          historyContext: this.formatHistory(historyMessages),
          knowledgeContext: this.formatContext(contextChunks),
          memoryContext: this.formatMemory(memoryContext),
          question,
          summary: memoryContext?.summary ?? 'No summary memory.',
        }),
      },
    ];
  }

  private formatMemory(memoryContext: MemoryContext | undefined): string {
    if (!memoryContext) {
      return 'No memory context.';
    }

    const shortTermMemory = memoryContext.shortTermMessages.map(
      (message) => `${message.role.toUpperCase()}: ${message.content}`,
    );
    const longTermMemory = memoryContext.longTermMemories.map((memory) => `- ${memory.content}`);
    const lines = [...longTermMemory, ...shortTermMemory];

    return lines.length > 0 ? lines.join('\n') : 'No memory context.';
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
