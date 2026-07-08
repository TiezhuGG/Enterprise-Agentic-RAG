import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import { AnswerNode } from '../nodes/answer.node';
import { GraphNode } from '../nodes/graph.node';
import { MemoryNode } from '../nodes/memory.node';
import { PlannerNode } from '../nodes/planner.node';
import { RetrievalNode } from '../nodes/retrieval.node';
import { VerificationNode } from '../nodes/verification.node';
import type { AgentState } from './agent.state';

export const AGENT_START = '__start__';
export const AGENT_END = '__end__';

@Injectable()
export class AgentGraph {
  constructor(
    private readonly answerNode: AnswerNode,
    private readonly configService: ConfigService,
    private readonly graphNode: GraphNode,
    private readonly memoryNode: MemoryNode,
    private readonly plannerNode: PlannerNode,
    private readonly retrievalNode: RetrievalNode,
    private readonly verificationNode: VerificationNode,
  ) {}

  async run(initialState: AgentState): Promise<AgentState> {
    let state = initialState;
    let iterations = 0;

    const visit = async (nodeName: string, handler: () => Promise<AgentState>) => {
      iterations += 1;

      if (iterations > this.configService.getAgentConfig().maxIterations) {
        throw new InternalServerErrorException(`Agent max iterations exceeded at ${nodeName}`);
      }

      return handler();
    };

    state = await visit('memory', () => this.memoryNode.run(state));
    state = await visit('planner', () => this.plannerNode.run(state));

    if (state.needsRetrieval) {
      state = await visit('retrieval', () => this.retrievalNode.run(state));
    }

    if (state.needsGraph) {
      state = await visit('graph', () => this.graphNode.run(state));
    }

    state = await visit('answer', () => this.answerNode.run(state));
    state = await visit('verification', () => this.verificationNode.run(state));

    return state;
  }
}
