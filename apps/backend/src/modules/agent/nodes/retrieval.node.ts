import { Injectable } from '@nestjs/common';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';
import { RetrievalTool } from '../tools/retrieval.tool';
import { ToolRegistry } from '../tools/tool.registry';

@Injectable()
export class RetrievalNode implements AgentNode {
  constructor(private readonly toolRegistry: ToolRegistry) {}

  async run(state: AgentState): Promise<AgentState> {
    if (!state.needsRetrieval) {
      return {
        ...state,
        retrievalContext: [],
      };
    }

    const retrievalTool = this.toolRegistry.get<RetrievalTool>('retrieval');
    const query = state.followUpQuery ?? state.queryRewrite ?? state.question;
    const retrievalResult = await retrievalTool.retrieveWithBreakdown(state.executionContext, {
      enableGraph: false,
      keywordLimit: state.request.keywordLimit,
      limit: state.request.limit,
      maxContextTokens: state.request.maxContextTokens,
      query,
      vectorLimit: state.request.vectorLimit,
    });

    return {
      ...state,
      retrievalBreakdown: retrievalResult.breakdown,
      retrievalContext: retrievalResult.chunks,
    };
  }
}
