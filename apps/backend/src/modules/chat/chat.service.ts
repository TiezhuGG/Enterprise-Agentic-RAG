import { Inject, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { RetrievalService } from '../retrieval';
import type { ContextChunk } from '../retrieval';
import type { ChatCitation, ChatRequestDto, ChatResponse } from './chat.types';
import { LLM_PROVIDER, type LlmProvider } from './providers/llm.provider';
import { PromptBuilder } from './prompt/prompt.builder';

@Injectable()
export class ChatService {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    private readonly promptBuilder: PromptBuilder,
    private readonly retrievalService: RetrievalService,
  ) {}

  async chat(context: ExecutionContext, input: ChatRequestDto): Promise<ChatResponse> {
    const question = input.question.trim();
    const contextChunks = await this.retrieveContext(context, input, question);
    const messages = this.promptBuilder.build(question, contextChunks);
    const answer = await this.llmProvider.chat(messages);

    return {
      answer,
      citations: this.toCitations(contextChunks),
    };
  }

  async *stream(context: ExecutionContext, input: ChatRequestDto): AsyncIterable<string> {
    const question = input.question.trim();
    const contextChunks = await this.retrieveContext(context, input, question);
    const messages = this.promptBuilder.build(question, contextChunks);

    for await (const token of this.llmProvider.stream(messages)) {
      yield token;
    }
  }

  private retrieveContext(
    context: ExecutionContext,
    input: ChatRequestDto,
    question: string,
  ): Promise<ContextChunk[]> {
    return this.retrievalService.retrieve(context, {
      query: question,
      keywordLimit: input.keywordLimit,
      limit: input.limit,
      maxContextTokens: input.maxContextTokens,
      vectorLimit: input.vectorLimit,
    });
  }

  private toCitations(contextChunks: ContextChunk[]): ChatCitation[] {
    return contextChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      score: chunk.score,
      metadata: chunk.metadata,
    }));
  }
}
