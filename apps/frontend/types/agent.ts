export type AgentEventType =
  'thought' | 'retrieval' | 'graph' | 'token' | 'citation' | 'done' | 'error';

export interface AgentTraceEntry {
  node: string;
  startTime: string;
  endTime: string;
  status: 'success' | 'failed' | 'skipped';
}

export interface AgentCitation {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  metadata: Record<string, string | number>;
}

export interface AgentResponse {
  executionId: string;
  answer: string;
  citations: AgentCitation[];
  metadata: {
    verified: boolean;
    usedGraph: boolean;
    usedMemory: boolean;
    trace: AgentTraceEntry[];
  };
}

export interface AgentChatRequest {
  conversationId: string;
  question: string;
  attachmentIds?: string[];
  limit?: number;
  vectorLimit?: number;
  keywordLimit?: number;
  maxContextTokens?: number;
}

export interface AgentEvent<TData = unknown> {
  type: AgentEventType;
  data: TData;
}

export interface ThoughtEventData {
  executionId: string;
  needsGraph: boolean;
  needsRetrieval: boolean;
}

export interface RetrievalEventData {
  executionId: string;
  count: number;
}

export interface TokenEventData {
  executionId: string;
  token: string;
}

export interface ErrorEventData {
  message: string;
}
