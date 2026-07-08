import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';
import { MemoryTool } from '../tools/memory.tool';

@Injectable()
export class MemoryNode implements AgentNode {
  constructor(
    private readonly configService: ConfigService,
    private readonly memoryTool: MemoryTool,
  ) {}

  async run(state: AgentState): Promise<AgentState> {
    if (!this.configService.getAgentConfig().enableMemory) {
      return {
        ...state,
        memoryContext: null,
      };
    }

    const memoryContext = await this.memoryTool.load(
      state.executionContext,
      state.conversationId,
      state.question,
    );

    return {
      ...state,
      memoryContext,
    };
  }
}
