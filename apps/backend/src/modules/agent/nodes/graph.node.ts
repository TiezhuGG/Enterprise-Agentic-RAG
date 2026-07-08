import { Injectable } from '@nestjs/common';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';
import { GraphTool } from '../tools/graph.tool';
import { ToolRegistry } from '../tools/tool.registry';

@Injectable()
export class GraphNode implements AgentNode {
  constructor(private readonly toolRegistry: ToolRegistry) {}

  async run(state: AgentState): Promise<AgentState> {
    if (!state.needsGraph) {
      return {
        ...state,
        graphContext: [],
      };
    }

    const graphTool = this.toolRegistry.get<GraphTool>('graph');
    const query = state.followUpQuery ?? state.queryRewrite ?? state.question;
    const graphContext = await graphTool.invoke({
      context: state.executionContext,
      limit: state.request.keywordLimit ?? state.request.limit ?? 10,
      query,
    });

    return {
      ...state,
      graphContext,
    };
  }
}
