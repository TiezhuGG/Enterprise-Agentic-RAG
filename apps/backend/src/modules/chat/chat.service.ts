import { Inject, Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { ConversationService, type MessageEntity } from '../conversation';
import { RetrievalService } from '../retrieval';
import type { ContextChunk } from '../retrieval';
import type { ChatCitation, ChatHistoryMessage, ChatRequestDto, ChatResponse } from './chat.types';
import { LLM_PROVIDER, type LlmProvider } from './providers/llm.provider';
import { PromptBuilder } from './prompt/prompt.builder';

@Injectable()
export class ChatService {
  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LlmProvider,
    private readonly conversationService: ConversationService,
    private readonly promptBuilder: PromptBuilder,
    private readonly retrievalService: RetrievalService,
  ) {}

  async chat(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): Promise<ChatResponse> {
    const question = input.question.trim();
    const historyMessages = await this.getHistoryMessages(context, conversationId);

    await this.conversationService.createMessage(context, conversationId, {
      role: 'USER',
      content: question,
      metadata: {
        source: 'chat',
      },
    });

    const contextChunks = await this.retrieveContext(context, input, question);
    const messages = this.promptBuilder.build(question, contextChunks, historyMessages);
    const answer = await this.llmProvider.chat(messages);
    const citations = this.toCitations(contextChunks);

    await this.conversationService.createMessage(context, conversationId, {
      role: 'ASSISTANT',
      content: answer,
      metadata: {
        citations,
        source: 'chat',
      },
    });

    return {
      answer,
      citations,
    };
  }

  async *stream(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): AsyncIterable<string> {
    const question = input.question.trim();
    const historyMessages = await this.getHistoryMessages(context, conversationId);

    await this.conversationService.createMessage(context, conversationId, {
      role: 'USER',
      content: question,
      metadata: {
        source: 'chat-stream',
      },
    });

    const contextChunks = await this.retrieveContext(context, input, question);
    const messages = this.promptBuilder.build(question, contextChunks, historyMessages);
    const answerTokens: string[] = [];

    for await (const token of this.llmProvider.stream(messages)) {
      answerTokens.push(token);
      yield token;
    }

    await this.conversationService.createMessage(context, conversationId, {
      role: 'ASSISTANT',
      content: answerTokens.join(''),
      metadata: {
        citations: this.toCitations(contextChunks),
        source: 'chat-stream',
      },
    });
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

  private async getHistoryMessages(
    context: ExecutionContext,
    conversationId: string,
  ): Promise<ChatHistoryMessage[]> {
    const messages = await this.conversationService.listMessages(context, conversationId);

    return messages.map((message) => ({
      role: this.toChatHistoryRole(message),
      content: message.content,
    }));
  }

  private toChatHistoryRole(message: MessageEntity): ChatHistoryMessage['role'] {
    switch (message.role) {
      case 'ASSISTANT':
        return 'assistant';
      case 'SYSTEM':
        return 'system';
      case 'USER':
        return 'user';
    }
  }
}
