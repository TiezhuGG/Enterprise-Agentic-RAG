import type { AgentChatRequest, AgentEvent, AgentResponse, ErrorEventData } from '@/types/agent';
import { createApiUrl, createJsonHeaders, readApiError } from './api-client';

export const agentService = {
  async chat(request: AgentChatRequest): Promise<AgentResponse> {
    const response = await fetch(createApiUrl('/agent/chat'), {
      body: JSON.stringify(request),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    return (await response.json()) as AgentResponse;
  },

  async *streamChat(request: AgentChatRequest): AsyncIterable<AgentEvent> {
    const response = await fetch(createApiUrl('/agent/chat/stream'), {
      body: JSON.stringify(request),
      headers: createJsonHeaders(),
      method: 'POST',
    });

    if (!response.ok) {
      throw await readApiError(response);
    }

    if (!response.body) {
      throw new Error('Streaming response body is unavailable');
    }

    yield* parseAgentEventStream(response.body);
  },
};

async function* parseAgentEventStream(
  stream: ReadableStream<Uint8Array>,
): AsyncIterable<AgentEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const rawEvent of events) {
        const event = parseAgentEvent(rawEvent);

        if (event) {
          yield event;
        }
      }
    }

    buffer += decoder.decode();

    if (buffer.trim()) {
      const event = parseAgentEvent(buffer);

      if (event) {
        yield event;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

const parseAgentEvent = (rawEvent: string): AgentEvent | null => {
  const data = rawEvent
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n')
    .trim();

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as AgentEvent;
  } catch {
    return {
      data: {
        message: 'Unable to parse agent stream event',
      } satisfies ErrorEventData,
      type: 'error',
    };
  }
};
