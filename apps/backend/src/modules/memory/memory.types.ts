import type { ChatHistoryMessage } from '../chat/chat.types';

export interface MemoryRecord {
  id: string;
  content: string;
  score?: number;
  metadata: Record<string, unknown>;
}

export interface MemorySaveInput {
  id?: string;
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchInput {
  userId: string;
  query: string;
  limit?: number;
}

export interface MemoryDeleteInput {
  id: string;
  userId: string;
}

export interface MemoryProvider {
  save(input: MemorySaveInput): Promise<MemoryRecord | void>;
  search(input: MemorySearchInput): Promise<MemoryRecord[]>;
  delete(input: MemoryDeleteInput): Promise<void>;
}

export interface MemoryMessage {
  role: ChatHistoryMessage['role'];
  content: string;
  createdAt: string;
}

export interface MemoryContext {
  shortTermMessages: MemoryMessage[];
  summary: string | null;
  longTermMemories: MemoryRecord[];
}

export interface SaveConversationTurnInput {
  answer: string;
  conversationId: string;
  messages: ChatHistoryMessage[];
  question: string;
}

export interface MemoryListResponse {
  memories: MemoryRecord[];
}
