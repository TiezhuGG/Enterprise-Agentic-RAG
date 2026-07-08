import { Injectable } from '@nestjs/common';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';

@Injectable()
export class VerificationNode implements AgentNode {
  async run(state: AgentState): Promise<AgentState> {
    const hasAnswer = Boolean(state.answer?.trim());
    const contextCount = state.retrievalContext.length + state.graphContext.length;
    const hasContext = contextCount > 0;
    const hasCitations = state.citations.length > 0;
    const canRetry = state.iteration < state.maxIterations;
    const needsMoreContext = canRetry && (!hasContext || (hasContext && !hasCitations));
    const grounded = hasAnswer && hasContext && hasCitations;
    const reason = this.getReason({
      canRetry,
      hasAnswer,
      hasCitations,
      hasContext,
      needsMoreContext,
    });

    return {
      ...state,
      followUpQuery: needsMoreContext
        ? (state.followUpQuery ?? state.queryRewrite ?? state.question)
        : undefined,
      needsMoreContext,
      needsRetrieval: needsMoreContext ? true : state.needsRetrieval,
      verificationResult: {
        followUpQuery: needsMoreContext
          ? (state.followUpQuery ?? state.queryRewrite ?? state.question)
          : undefined,
        grounded,
        needsMoreContext,
        reason,
      },
      verified: grounded,
    };
  }

  private getReason(input: {
    canRetry: boolean;
    hasAnswer: boolean;
    hasCitations: boolean;
    hasContext: boolean;
    needsMoreContext: boolean;
  }): string {
    if (!input.hasAnswer) {
      return 'answer_empty';
    }

    if (input.needsMoreContext && !input.hasContext) {
      return 'context_empty';
    }

    if (input.needsMoreContext && !input.hasCitations) {
      return 'citations_empty';
    }

    if (!input.canRetry && (!input.hasContext || !input.hasCitations)) {
      return 'max_iterations_reached';
    }

    return 'grounded';
  }
}
