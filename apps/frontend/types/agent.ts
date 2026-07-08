export type AgentEventType =
  | 'thought'
  | 'iteration'
  | 'retrieval'
  | 'graph'
  | 'token'
  | 'verification'
  | 'citation'
  | 'done'
  | 'error';

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
    iteration?: number;
    maxIterations?: number;
    verified: boolean;
    verificationResult?: AgentVerificationResult | null;
    usedGraph: boolean;
    usedMemory: boolean;
    trace: AgentTraceEntry[];
  };
}

export interface AgentVerificationResult {
  followUpQuery?: string;
  grounded: boolean;
  needsMoreContext: boolean;
  reason: string;
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

export interface IterationEventData {
  executionId: string;
  followUpQuery?: string;
  iteration: number;
  maxIterations: number;
  needsGraph: boolean;
  needsRetrieval: boolean;
}

export interface RetrievalEventData {
  executionId: string;
  count: number;
}

export interface GraphEventData {
  executionId: string;
  count: number;
}

export interface TokenEventData {
  executionId: string;
  token: string;
}

export interface VerificationEventData {
  executionId: string;
  followUpQuery?: string;
  iteration: number;
  maxIterations: number;
  needsMoreContext: boolean;
  reason?: string;
  verified: boolean;
}

export type CitationEventData = AgentCitation;

export type DoneEventData = AgentResponse;

export interface ErrorEventData {
  message: string;
}
