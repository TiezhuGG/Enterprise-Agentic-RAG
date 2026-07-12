import type { ChatMessage } from '../chat.types';

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmChatOptions {
  maxTokens?: number;
  timeoutMs?: number;
}

export interface LlmProvider {
  chat(messages: ChatMessage[], options?: LlmChatOptions): Promise<string>;
  stream(messages: ChatMessage[]): AsyncIterable<string>;
}
