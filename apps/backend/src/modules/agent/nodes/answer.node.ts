import { Inject, Injectable } from '@nestjs/common';
import { LLM_PROVIDER, type LlmProvider } from '../../chat/providers/llm.provider';
import { PromptBuilder } from '../../chat/prompt/prompt.builder';
import type { ContextChunk } from '../../retrieval';
import type { AgentCitation } from '../graph/agent.state';
import type { AgentNode } from '../agent.types';
import type { AgentState } from '../graph/agent.state';

@Injectable()
export class AnswerNode implements AgentNode {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    private readonly promptBuilder: PromptBuilder,
  ) {}

  async run(state: AgentState): Promise<AgentState> {
    const contextChunks = this.mergeContext(state);
    const messages = this.promptBuilder.build(
      state.question,
      contextChunks,
      state.historyMessages,
      state.memoryContext ?? undefined,
    );
    const answer = await this.llmProvider.chat(messages);

    return {
      ...state,
      answer,
      citations: this.toCitations(contextChunks),
    };
  }

  async runStream(
    state: AgentState,
    onToken: (token: string) => Promise<void> | void,
  ): Promise<AgentState> {
    const contextChunks = this.mergeContext(state);
    const messages = this.promptBuilder.build(
      state.question,
      contextChunks,
      state.historyMessages,
      state.memoryContext ?? undefined,
    );
    const answerTokens: string[] = [];

    for await (const token of this.llmProvider.stream(messages)) {
      answerTokens.push(token);
      await onToken(token);
    }

    return {
      ...state,
      answer: answerTokens.join(''),
      citations: this.toCitations(contextChunks),
    };
  }

  private mergeContext(state: AgentState): ContextChunk[] {
    return [
      ...state.retrievalContext,
      ...state.graphContext.map((graphContext, index) => ({
        chunkId: `graph:${graphContext.documentId}:${index + 1}`,
        content: graphContext.content,
        documentId: graphContext.documentId,
        metadata: {
          documentId: graphContext.documentId,
          graphSource: graphContext.source,
          graphTarget: graphContext.target,
          graphType: graphContext.type,
          sectionTitle: 'Knowledge Graph',
          sequence: index + 1,
        },
        score: graphContext.score,
      })),
    ];
  }

  private toCitations(contextChunks: ContextChunk[]): AgentCitation[] {
    return contextChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      content: chunk.content,
      documentId: chunk.documentId,
      metadata: chunk.metadata,
      score: chunk.score,
    }));
  }
}
