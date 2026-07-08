import { Injectable } from '@nestjs/common';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';
import { RetrievalTool } from '../tools/retrieval.tool';

@Injectable()
export class RetrievalNode implements AgentNode {
  constructor(private readonly retrievalTool: RetrievalTool) {}

  async run(state: AgentState): Promise<AgentState> {
    if (!state.needsRetrieval) {
      return {
        ...state,
        retrievalContext: [],
      };
    }

    const retrievalContext = await this.retrievalTool.retrieve(state.executionContext, {
      enableGraph: false,
      keywordLimit: state.request.keywordLimit,
      limit: state.request.limit,
      maxContextTokens: state.request.maxContextTokens,
      query: state.question,
      vectorLimit: state.request.vectorLimit,
    });

    return {
      ...state,
      retrievalContext,
    };
  }
}
