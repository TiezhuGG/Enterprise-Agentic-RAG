import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import { ObservabilityService } from '../../../infrastructure/observability';
import { LLM_PROVIDER, type LlmProvider } from '../../chat/providers/llm.provider';
import type { AgentNode, PlannerDecision } from '../agent.types';
import type { AgentState } from '../graph/agent.state';

const complexQuestionPattern =
  /关系|关联|路径|链路|影响|依赖|上下游|因果|比较|为什么|如何|怎么|跨|between|relation|relationship|impact|depend|compare|why|how/i;

@Injectable()
export class PlannerNode implements AgentNode {
  constructor(
    private readonly configService: ConfigService,
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    private readonly observabilityService: ObservabilityService,
  ) {}

  async run(state: AgentState): Promise<AgentState> {
    const agentConfig = this.configService.getAgentConfig();
    const startedAt = Date.now();
    let plannerAnswer: string;

    try {
      plannerAnswer = await this.llmProvider.chat([
        {
          role: 'system',
          content:
            'You are the planner for an Enterprise RAG workflow. Return strict JSON only: {"needsRetrieval":true,"needsGraph":boolean}. Simple factual questions use retrieval only. Complex relationship, dependency, causal, cross-document, or multi-hop questions need graph.',
        },
        {
          role: 'user',
          content: `Question:\n${state.question}`,
        },
      ]);
      this.observabilityService.recordLlmRequest({
        context: state.executionContext,
        durationMs: Date.now() - startedAt,
        mode: 'chat',
        operation: 'agent.planner',
        status: 'success',
      });
    } catch (error) {
      this.observabilityService.recordLlmRequest({
        context: state.executionContext,
        durationMs: Date.now() - startedAt,
        error,
        mode: 'chat',
        operation: 'agent.planner',
        status: 'failed',
      });
      throw error;
    }

    const decision = this.parseDecision(plannerAnswer, state.question);

    return {
      ...state,
      needsGraph: agentConfig.enableGraph && decision.needsGraph,
      needsRetrieval: decision.needsRetrieval,
    };
  }

  private parseDecision(rawDecision: string, question: string): PlannerDecision {
    const jsonCandidate = rawDecision.match(/\{[\s\S]*\}/)?.[0];

    if (jsonCandidate) {
      try {
        const parsedDecision = JSON.parse(jsonCandidate) as Partial<PlannerDecision>;

        return {
          needsGraph: parsedDecision.needsGraph === true,
          needsRetrieval: parsedDecision.needsRetrieval !== false,
        };
      } catch {
        return this.fallbackDecision(question);
      }
    }

    return this.fallbackDecision(question);
  }

  private fallbackDecision(question: string): PlannerDecision {
    return {
      needsGraph: complexQuestionPattern.test(question),
      needsRetrieval: true,
    };
  }
}
