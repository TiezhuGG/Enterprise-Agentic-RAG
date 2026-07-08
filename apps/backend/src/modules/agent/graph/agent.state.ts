import type { ExecutionContext } from '../../../common';
import type { ChatCitation, ChatHistoryMessage, ChatRequestDto } from '../../chat/chat.types';
import type { GraphContext } from '../../knowledge-graph';
import type { MemoryContext } from '../../memory';
import type { ContextChunk } from '../../retrieval';

export interface AgentState {
  question: string;
  conversationId: string;
  executionContext: ExecutionContext;
  memoryContext: MemoryContext | null;
  retrievalContext: ContextChunk[];
  graphContext: GraphContext[];
  answer: string | null;
  needsGraph: boolean;
  needsRetrieval: boolean;
  verified: boolean;
  historyMessages: ChatHistoryMessage[];
  citations: ChatCitation[];
  request: ChatRequestDto;
}

export const createInitialAgentState = (input: {
  conversationId: string;
  executionContext: ExecutionContext;
  historyMessages: ChatHistoryMessage[];
  question: string;
  request: ChatRequestDto;
}): AgentState => ({
  answer: null,
  citations: [],
  conversationId: input.conversationId,
  executionContext: input.executionContext,
  graphContext: [],
  historyMessages: input.historyMessages,
  memoryContext: null,
  needsGraph: false,
  needsRetrieval: true,
  question: input.question,
  request: input.request,
  retrievalContext: [],
  verified: false,
});
