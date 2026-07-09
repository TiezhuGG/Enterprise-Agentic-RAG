import { InternalServerErrorException, Injectable } from '@nestjs/common';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ConfigService } from '../../../config';
import { ObservabilityService } from '../../../infrastructure/observability';
import { AnswerNode } from '../nodes/answer.node';
import { GraphNode } from '../nodes/graph.node';
import { MemoryNode } from '../nodes/memory.node';
import { PlannerNode } from '../nodes/planner.node';
import { RetrievalNode } from '../nodes/retrieval.node';
import { VerificationNode } from '../nodes/verification.node';
import type { AgentState } from './agent.state';
import type { AgentEvent } from '../agent.types';
import type {
  RetrievalPipelineBreakdown,
  RetrievalPipelineStage,
  RetrievalStageBreakdown,
} from '../../retrieval';

export const AGENT_START = START;
export const AGENT_END = END;

const AgentRuntimeState = Annotation.Root({
  state: Annotation<AgentState>(),
});

type AgentRuntimeStateValue = typeof AgentRuntimeState.State;

export interface AgentGraphTraceEvent {
  durationMs?: number;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  node?: string;
  stage: string;
  status: 'FAILED' | 'SKIPPED' | 'SUCCEEDED';
  type: 'answer' | 'graph' | 'iteration' | 'memory' | 'planner' | 'retrieval' | 'verification';
}

export interface AgentGraphRunOptions {
  onEvent?: (event: AgentEvent) => Promise<void> | void;
  onTraceEvent?: (event: AgentGraphTraceEvent) => Promise<void> | void;
}

@Injectable()
export class AgentGraph {
  constructor(
    private readonly answerNode: AnswerNode,
    private readonly configService: ConfigService,
    private readonly graphNode: GraphNode,
    private readonly memoryNode: MemoryNode,
    private readonly observabilityService: ObservabilityService,
    private readonly plannerNode: PlannerNode,
    private readonly retrievalNode: RetrievalNode,
    private readonly verificationNode: VerificationNode,
  ) {}

  async run(initialState: AgentState, options: AgentGraphRunOptions = {}): Promise<AgentState> {
    const agentConfig = this.configService.getAgentConfig();
    const initialRuntimeState: AgentState = {
      ...initialState,
      maxIterations: agentConfig.maxIterations,
    };
    const maxNodeExecutions = agentConfig.maxIterations * 8 + 8;
    let nodeExecutions = 0;

    const visit = async (
      nodeName: string,
      currentState: AgentState,
      handler: (state: AgentState) => Promise<AgentState>,
    ): Promise<AgentRuntimeStateValue> => {
      nodeExecutions += 1;
      const startTime = new Date().toISOString();
      const startedAt = Date.now();
      const requestId = this.observabilityService.getRequestId(currentState.executionContext);

      if (nodeExecutions > maxNodeExecutions) {
        throw new InternalServerErrorException(
          `Agent node execution limit exceeded at ${nodeName}`,
        );
      }

      try {
        const nextState = await handler(currentState);
        const durationMs = Date.now() - startedAt;

        this.observabilityService.recordAgentNode({
          durationMs,
          executionId: nextState.executionId,
          node: nodeName,
          requestId,
          status: 'success',
        });
        await options.onTraceEvent?.({
          durationMs,
          metadata: this.getTraceMetadata(nodeName, nextState),
          node: nodeName,
          stage: nodeName,
          status: 'SUCCEEDED',
          type: this.toTraceEventType(nodeName),
        });

        return {
          state: {
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
          },
        };
      } catch (error) {
        const durationMs = Date.now() - startedAt;

        this.observabilityService.recordAgentNode({
          durationMs,
          executionId: currentState.executionId,
          node: nodeName,
          requestId,
          status: 'failed',
        });
        await options.onTraceEvent?.({
          durationMs,
          errorMessage: this.toErrorMessage(error),
          metadata: {
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError',
          },
          node: nodeName,
          stage: nodeName,
          status: 'FAILED',
          type: this.toTraceEventType(nodeName),
        });

        throw error;
      }
    };

    const skip = async (
      nodeName: string,
      currentState: AgentState,
    ): Promise<AgentRuntimeStateValue> => {
      const timestamp = new Date().toISOString();

      this.observabilityService.recordAgentNode({
        durationMs: 0,
        executionId: currentState.executionId,
        node: nodeName,
        requestId: this.observabilityService.getRequestId(currentState.executionContext),
        status: 'skipped',
      });
      await options.onTraceEvent?.({
        durationMs: 0,
        metadata: {
          status: 'skipped',
        },
        node: nodeName,
        stage: nodeName,
        status: 'SKIPPED',
        type: this.toTraceEventType(nodeName),
      });

      return {
        state: {
          ...currentState,
          trace: [
            ...currentState.trace,
            {
              endTime: timestamp,
              node: nodeName,
              startTime: timestamp,
              status: 'skipped',
            },
          ],
        },
      };
    };

    const runtimeGraph = new StateGraph(AgentRuntimeState)
      .addNode('memory', (input) =>
        visit('memory', input.state, (state) => this.memoryNode.run(state)),
      )
      .addNode('planner', async (input) => {
        const next = await visit('planner', input.state, (state) => this.plannerNode.run(state));
        await options.onEvent?.({
          data: {
            executionId: next.state.executionId,
            needsGraph: next.state.needsGraph,
            needsRetrieval: next.state.needsRetrieval,
          },
          type: 'thought',
        });
        return next;
      })
      .addNode('skip_retrieval', (input) => skip('retrieval', input.state))
      .addNode('retrieval', async (input) => {
        const next = await visit('retrieval', input.state, (state) =>
          this.retrievalNode.run(state),
        );
        await options.onEvent?.({
          data: {
            count: next.state.retrievalContext.length,
            executionId: next.state.executionId,
            ...this.toRetrievalBreakdownMetadata(next.state.retrievalBreakdown),
          },
          type: 'retrieval',
        });
        return next;
      })
      .addNode('skip_graph', (input) => skip('graph', input.state))
      .addNode('graph', async (input) => {
        const next = await visit('graph', input.state, (state) => this.graphNode.run(state));
        await options.onEvent?.({
          data: {
            count: next.state.graphContext.length,
            executionId: next.state.executionId,
          },
          type: 'graph',
        });
        return next;
      })
      .addNode('answer', (input) =>
        visit('answer', input.state, (state) =>
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
        ),
      )
      .addNode('verification', async (input) => {
        const next = await visit('verification', input.state, (state) =>
          this.verificationNode.run(state),
        );
        await options.onEvent?.({
          data: {
            executionId: next.state.executionId,
            followUpQuery: next.state.verificationResult?.followUpQuery,
            iteration: next.state.iteration,
            maxIterations: next.state.maxIterations,
            needsMoreContext: next.state.needsMoreContext,
            reason: next.state.verificationResult?.reason,
            verified: next.state.verified,
          },
          type: 'verification',
        });
        return next;
      })
      .addNode('iteration', async (input) => {
        const next = await visit('iteration', input.state, async (state) => ({
          ...state,
          answer: null,
          citations: [],
          followUpQuery: state.verificationResult?.followUpQuery ?? state.followUpQuery,
          iteration: state.iteration + 1,
          needsMoreContext: false,
          needsRetrieval: true,
          verificationResult: null,
          verified: false,
        }));
        await options.onEvent?.({
          data: {
            executionId: next.state.executionId,
            followUpQuery: next.state.followUpQuery,
            iteration: next.state.iteration,
            maxIterations: next.state.maxIterations,
            needsGraph: next.state.needsGraph,
            needsRetrieval: next.state.needsRetrieval,
          },
          type: 'iteration',
        });
        return next;
      })
      .addEdge(START, 'memory')
      .addEdge('memory', 'planner')
      .addConditionalEdges('planner', (input) =>
        input.state.needsRetrieval ? 'retrieval' : 'skip_retrieval',
      )
      .addConditionalEdges('iteration', (input) =>
        input.state.needsRetrieval ? 'retrieval' : 'skip_retrieval',
      )
      .addConditionalEdges('skip_retrieval', (input) =>
        input.state.needsGraph ? 'graph' : 'skip_graph',
      )
      .addConditionalEdges('retrieval', (input) =>
        input.state.needsGraph ? 'graph' : 'skip_graph',
      )
      .addEdge('skip_graph', 'answer')
      .addEdge('graph', 'answer')
      .addEdge('answer', 'verification')
      .addConditionalEdges('verification', (input) =>
        input.state.needsMoreContext && input.state.iteration < input.state.maxIterations
          ? 'iteration'
          : END,
      )
      .compile();

    const result = await runtimeGraph.invoke({ state: initialRuntimeState });

    return result.state;
  }

  private toTraceEventType(nodeName: string): AgentGraphTraceEvent['type'] {
    if (nodeName === 'skip_graph') {
      return 'graph';
    }

    if (nodeName === 'skip_retrieval') {
      return 'retrieval';
    }

    return nodeName as AgentGraphTraceEvent['type'];
  }

  private getTraceMetadata(nodeName: string, state: AgentState): Record<string, unknown> {
    switch (nodeName) {
      case 'memory':
        return {
          hasSummary: Boolean(state.memoryContext?.summary),
          memoryLongTermCount: state.memoryContext?.longTermMemories.length ?? 0,
          memoryShortTermCount: state.memoryContext?.shortTermMessages.length ?? 0,
        };
      case 'planner':
        return {
          hasQueryRewrite: Boolean(state.queryRewrite),
          needsGraph: state.needsGraph,
          needsRetrieval: state.needsRetrieval,
        };
      case 'retrieval':
        return {
          count: state.retrievalContext.length,
          retrievalCount: state.retrievalContext.length,
          ...this.toRetrievalBreakdownMetadata(state.retrievalBreakdown),
        };
      case 'graph':
        return {
          count: state.graphContext.length,
          graphCount: state.graphContext.length,
        };
      case 'answer':
        return {
          citationCount: state.citations.length,
        };
      case 'verification':
        return {
          iteration: state.iteration,
          maxIterations: state.maxIterations,
          needsMoreContext: state.needsMoreContext,
          reason: state.verificationResult?.reason,
          verified: state.verified,
        };
      case 'iteration':
        return {
          iteration: state.iteration,
          maxIterations: state.maxIterations,
          needsGraph: state.needsGraph,
          needsRetrieval: state.needsRetrieval,
        };
      default:
        return {};
    }
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Agent node execution failed';
  }

  private toRetrievalBreakdownMetadata(
    breakdown: RetrievalPipelineBreakdown | null,
  ): Record<string, unknown> {
    if (!breakdown) {
      return {};
    }

    return {
      contextBuilderDurationMs: this.findStageDuration(breakdown.stages, 'context-builder'),
      contextCount: breakdown.contextCount,
      filteredCount: breakdown.filteredCount,
      graphCount: breakdown.graphCount,
      graphDurationMs: this.findStageDuration(breakdown.stages, 'graph'),
      graphStatus: this.findStageStatus(breakdown.stages, 'graph'),
      keywordCount: breakdown.keywordCount,
      keywordDurationMs: this.findStageDuration(breakdown.stages, 'keyword'),
      permissionFilterDurationMs: this.findStageDuration(breakdown.stages, 'permission-filter'),
      rerankedCount: breakdown.rerankedCount,
      rerankerDurationMs: this.findStageDuration(breakdown.stages, 'reranker'),
      retrievalDurationMs: breakdown.totalDurationMs,
      rrfCount: breakdown.rrfCount,
      rrfDurationMs: this.findStageDuration(breakdown.stages, 'rrf'),
      scopedSpaceCount: breakdown.scopedSpaceCount,
      vectorCount: breakdown.vectorCount,
      vectorDurationMs: this.findStageDuration(breakdown.stages, 'vector'),
    };
  }

  private findStageDuration(
    stages: RetrievalStageBreakdown[],
    stage: RetrievalPipelineStage,
  ): number {
    return stages.find((item) => item.stage === stage)?.durationMs ?? 0;
  }

  private findStageStatus(
    stages: RetrievalStageBreakdown[],
    stage: RetrievalPipelineStage,
  ): string {
    return stages.find((item) => item.stage === stage)?.status ?? 'skipped';
  }
}
