import type { Conversation, ConversationMessage } from '@/types/conversation';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const conversationService = {
  async list(): Promise<Conversation[]> {
    const response = await fetch(createApiUrl('/conversations'), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as Conversation[];
  },

  async create(title?: string): Promise<Conversation> {
    const response = await fetch(createApiUrl('/conversations'), {
      body: JSON.stringify({ title }),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as Conversation;
  },

  async delete(conversationId: string): Promise<Conversation> {
    const response = await fetch(createApiUrl(`/conversations/${conversationId}`), {
      headers: createJsonHeaders(),
      method: 'DELETE',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as Conversation;
  },

  async listMessages(conversationId: string): Promise<ConversationMessage[]> {
    const response = await fetch(createApiUrl(`/conversations/${conversationId}/messages`), {
      headers: createJsonHeaders(),
      method: 'GET',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as ConversationMessage[];
  },
};
