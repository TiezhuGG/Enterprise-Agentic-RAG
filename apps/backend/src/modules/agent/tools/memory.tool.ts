import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../../common';
import { MemoryService, type SaveConversationTurnInput } from '../../memory';

@Injectable()
export class MemoryTool {
  constructor(private readonly memoryService: MemoryService) {}

  load(context: ExecutionContext, conversationId: string, question: string) {
    return this.memoryService.getMemory(context, conversationId, question);
  }

  saveTurn(context: ExecutionContext, input: SaveConversationTurnInput): Promise<void> {
    return this.memoryService.saveTurn(context, input);
  }
}
