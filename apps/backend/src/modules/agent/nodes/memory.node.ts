import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';
import { MemoryTool } from '../tools/memory.tool';
import { ToolRegistry } from '../tools/tool.registry';

@Injectable()
export class MemoryNode implements AgentNode {
  constructor(
    private readonly configService: ConfigService,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  async run(state: AgentState): Promise<AgentState> {
    if (!this.configService.getAgentConfig().enableMemory) {
      return {
        ...state,
        memoryContext: null,
      };
    }

    const memoryTool = this.toolRegistry.get<MemoryTool>('memory');
    const memoryContext = await memoryTool.invoke({
      context: state.executionContext,
      conversationId: state.conversationId,
      question: state.question,
    });

    return {
      ...state,
      memoryContext,
    };
  }
}
