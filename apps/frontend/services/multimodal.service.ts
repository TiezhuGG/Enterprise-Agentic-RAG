import type { MultimodalAttachment } from '@/types/multimodal';
import { createApiUrl, getAuthToken, readApiError } from './api-client';

export const multimodalService = {
  async uploadAttachment(file: File, conversationId?: string): Promise<MultimodalAttachment> {
    const formData = new FormData();
    formData.append('file', file);

    if (conversationId) {
      formData.append('conversationId', conversationId);
    }

    const token = getAuthToken();
    const response = await fetch(createApiUrl('/multimodal/attachments'), {
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as MultimodalAttachment;
  },
};
