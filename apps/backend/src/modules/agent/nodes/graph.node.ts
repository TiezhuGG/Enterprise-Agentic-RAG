import { Injectable } from '@nestjs/common';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';
import { GraphTool } from '../tools/graph.tool';

@Injectable()
export class GraphNode implements AgentNode {
  constructor(private readonly graphTool: GraphTool) {}

  async run(state: AgentState): Promise<AgentState> {
    if (!state.needsGraph) {
      return {
        ...state,
        graphContext: [],
      };
    }

    const graphContext = await this.graphTool.retrieve(
      state.executionContext,
      state.question,
      state.request.keywordLimit ?? state.request.limit ?? 10,
    );

    return {
      ...state,
      graphContext,
    };
  }
}
