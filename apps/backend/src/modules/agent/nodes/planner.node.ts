import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '../../../config';
import { ObservabilityService } from '../../../infrastructure/observability';
import { LLM_PROVIDER, type LlmProvider } from '../../chat/providers/llm.provider';
import type { AgentNode, PlannerDecision } from '../agent.types';
import type { AgentState } from '../graph/agent.state';

const complexQuestionPattern =
  /\u5173\u7cfb|\u5173\u8054|\u8def\u5f84|\u94fe\u8def|\u5f71\u54cd|\u4f9d\u8d56|\u4e0a\u4e0b\u6e38|\u56e0\u679c|\u6bd4\u8f83|\u4e3a\u4ec0\u4e48|\u5982\u4f55|\u600e\u4e48|between|relation|relationship|impact|depend|compare|why|how/i;

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
            'You are the planner for an Enterprise RAG workflow. Return strict JSON only: {"needsRetrieval":true,"needsGraph":boolean,"queryRewrite":string|null}. Simple factual questions use retrieval only. Complex relationship, dependency, causal, cross-document, or multi-hop questions need graph. queryRewrite is optional and should preserve the user intent.',
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
      queryRewrite: this.normalizeQueryRewrite(decision.queryRewrite) ?? state.queryRewrite,
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
          queryRewrite:
            typeof parsedDecision.queryRewrite === 'string'
              ? parsedDecision.queryRewrite
              : undefined,
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

  private normalizeQueryRewrite(queryRewrite: string | undefined): string | undefined {
    const normalizedQuery = queryRewrite?.trim();

    if (!normalizedQuery || normalizedQuery.toLowerCase() === 'null') {
      return undefined;
    }

    return normalizedQuery;
  }
}
