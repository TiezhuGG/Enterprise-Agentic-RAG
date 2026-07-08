import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../../common';
import { MemoryService, type MemoryContext, type SaveConversationTurnInput } from '../../memory';
import type { AgentTool } from './tool.types';

export interface MemoryToolInput {
  context: ExecutionContext;
  conversationId: string;
  question: string;
}

@Injectable()
export class MemoryTool implements AgentTool<MemoryToolInput, MemoryContext> {
  readonly description = 'Load short-term, summary, and long-term memory context.';
  readonly name = 'memory' as const;

  constructor(private readonly memoryService: MemoryService) {}

  invoke(input: MemoryToolInput): Promise<MemoryContext> {
    return this.load(input.context, input.conversationId, input.question);
  }

  load(context: ExecutionContext, conversationId: string, question: string) {
    return this.memoryService.getMemory(context, conversationId, question);
  }

  saveTurn(context: ExecutionContext, input: SaveConversationTurnInput): Promise<void> {
    return this.memoryService.saveTurn(context, input);
  }
}
