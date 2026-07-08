import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import { AnswerNode } from '../nodes/answer.node';
import { GraphNode } from '../nodes/graph.node';
import { MemoryNode } from '../nodes/memory.node';
import { PlannerNode } from '../nodes/planner.node';
import { RetrievalNode } from '../nodes/retrieval.node';
import { VerificationNode } from '../nodes/verification.node';
import type { AgentState } from './agent.state';
import type { AgentEvent } from '../agent.types';

export const AGENT_START = '__start__';
export const AGENT_END = '__end__';

export interface AgentGraphRunOptions {
  onEvent?: (event: AgentEvent) => Promise<void> | void;
}

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

  async run(initialState: AgentState, options: AgentGraphRunOptions = {}): Promise<AgentState> {
    let state = initialState;
    let iterations = 0;

    const visit = async (nodeName: string, handler: () => Promise<AgentState>) => {
      iterations += 1;
      const startTime = new Date().toISOString();

      if (iterations > this.configService.getAgentConfig().maxIterations) {
        throw new InternalServerErrorException(`Agent max iterations exceeded at ${nodeName}`);
      }

      try {
        const nextState = await handler();

        return {
          ...nextState,
          trace: [
            ...nextState.trace,
            {
              endTime: new Date().toISOString(),
              node: nodeName,
              startTime,
              status: 'success' as const,
            },
          ],
        };
      } catch (error) {
        state = {
          ...state,
          trace: [
            ...state.trace,
            {
              endTime: new Date().toISOString(),
              node: nodeName,
              startTime,
              status: 'failed',
            },
          ],
        };

        throw error;
      }
    };
    const skip = (nodeName: string) => {
      const timestamp = new Date().toISOString();

      state = {
        ...state,
        trace: [
          ...state.trace,
          {
            endTime: timestamp,
            node: nodeName,
            startTime: timestamp,
            status: 'skipped',
          },
        ],
      };
    };

    state = await visit('memory', () => this.memoryNode.run(state));
    state = await visit('planner', () => this.plannerNode.run(state));
    await options.onEvent?.({
      data: {
        executionId: state.executionId,
        needsGraph: state.needsGraph,
        needsRetrieval: state.needsRetrieval,
      },
      type: 'thought',
    });

    if (state.needsRetrieval) {
      state = await visit('retrieval', () => this.retrievalNode.run(state));
      await options.onEvent?.({
        data: {
          count: state.retrievalContext.length,
          executionId: state.executionId,
        },
        type: 'retrieval',
      });
    } else {
      skip('retrieval');
    }

    if (state.needsGraph) {
      state = await visit('graph', () => this.graphNode.run(state));
      await options.onEvent?.({
        data: {
          count: state.graphContext.length,
          executionId: state.executionId,
        },
        type: 'graph',
      });
    } else {
      skip('graph');
    }

    state = await visit('answer', () =>
      options.onEvent
        ? this.answerNode.runStream(state, (token) =>
            options.onEvent?.({
              data: {
                executionId: state.executionId,
                token,
              },
              type: 'token',
            }),
          )
        : this.answerNode.run(state),
    );
    state = await visit('verification', () => this.verificationNode.run(state));

    return state;
  }
}
