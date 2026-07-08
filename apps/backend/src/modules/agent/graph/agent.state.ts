import { randomUUID } from 'node:crypto';
import type { ExecutionContext } from '../../../common';
import type { ChatHistoryMessage, ChatRequestDto } from '../../chat/chat.types';
import type { GraphContext } from '../../knowledge-graph';
import type { MemoryContext } from '../../memory';
import type { ContextChunk } from '../../retrieval';

export type AgentTraceStatus = 'success' | 'failed' | 'skipped';

export interface AgentTraceEntry {
  node: string;
  startTime: string;
  endTime: string;
  status: AgentTraceStatus;
}

export interface AgentCitation {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  metadata: ContextChunk['metadata'];
}

export interface AgentState {
  executionId: string;
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
  trace: AgentTraceEntry[];
  citations: AgentCitation[];
  request: ChatRequestDto;
}

export const createInitialAgentState = (input: {
  conversationId: string;
  executionContext: ExecutionContext;
  executionId?: string;
  historyMessages: ChatHistoryMessage[];
  question: string;
  request: ChatRequestDto;
}): AgentState => ({
  answer: null,
  citations: [],
  conversationId: input.conversationId,
  executionId: input.executionId ?? randomUUID(),
  executionContext: input.executionContext,
  graphContext: [],
  historyMessages: input.historyMessages,
  memoryContext: null,
  needsGraph: false,
  needsRetrieval: true,
  question: input.question,
  request: input.request,
  retrievalContext: [],
  trace: [],
  verified: false,
});
