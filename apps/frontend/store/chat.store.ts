'use client';

import { create } from 'zustand';
import { getAuthToken, setAuthToken as persistAuthToken } from '@/services/api-client';
import { agentService } from '@/services/agent.service';
import { conversationService } from '@/services/conversation.service';
import type {
  AgentCitation,
  AgentEvent,
  AgentResponse,
  AgentTraceEntry,
  ErrorEventData,
  RetrievalEventData,
  ThoughtEventData,
  TokenEventData,
} from '@/types/agent';
import type { Conversation, ConversationMessage } from '@/types/conversation';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  status?: 'streaming' | 'done' | 'error';
}

export interface AgentTraceItem {
  node: string;
  label: string;
  status: AgentTraceEntry['status'] | 'running';
  detail?: string;
}

interface ChatStore {
  authToken: string;
  conversationId: string | null;
  conversations: Conversation[];
  messages: ChatMessage[];
  streaming: boolean;
  streamingMessage: ChatMessage | null;
  trace: AgentTraceItem[];
  citations: AgentCitation[];
  error: string | null;
  initialize: () => Promise<void>;
  setAuthToken: (token: string) => void;
  createConversation: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendMessage: (question: string) => Promise<void>;
}

type ChatStoreSet = (
  partial: Partial<ChatStore> | ((state: ChatStore) => Partial<ChatStore>),
) => void;

const createMessageId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createTraceItem = (
  node: string,
  label: string,
  status: AgentTraceItem['status'],
  detail?: string,
): AgentTraceItem => ({
  detail,
  label,
  node,
  status,
});

const traceLabels: Record<string, string> = {
  answer: 'Answer',
  graph: 'Graph Search',
  memory: 'Memory',
  planner: 'Planning',
  retrieval: 'Retrieval',
  verification: 'Verification',
};

const mapTraceEntry = (entry: AgentTraceEntry): AgentTraceItem =>
  createTraceItem(entry.node, traceLabels[entry.node] ?? entry.node, entry.status);

const mapConversationMessage = (message: ConversationMessage): ChatMessage => ({
  content: message.content,
  createdAt: message.createdAt,
  id: message.id,
  role: message.role.toLowerCase() as ChatMessageRole,
  status: 'done',
});

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Request failed';

const upsertTrace = (trace: AgentTraceItem[], item: AgentTraceItem): AgentTraceItem[] => {
  const existingIndex = trace.findIndex((traceItem) => traceItem.node === item.node);

  if (existingIndex === -1) {
    return [...trace, item];
  }

  return trace.map((traceItem, index) => (index === existingIndex ? item : traceItem));
};

const mapDoneTrace = (response: AgentResponse): AgentTraceItem[] =>
  response.metadata.trace.map(mapTraceEntry);

export const useChatStore = create<ChatStore>((set, get) => ({
  authToken: '',
  citations: [],
  conversationId: null,
  conversations: [],
  error: null,
  messages: [],
  streaming: false,
  streamingMessage: null,
  trace: [],

  async initialize() {
    set({
      authToken: getAuthToken(),
      error: null,
    });

    try {
      const conversations = await conversationService.list();
      const activeConversation = conversations[0] ?? (await conversationService.create('New Chat'));

      set({
        conversationId: activeConversation.id,
        conversations: conversations.length > 0 ? conversations : [activeConversation],
      });

      await get().selectConversation(activeConversation.id);
    } catch (error) {
      set({
        error: toErrorMessage(error),
      });
    }
  },

  setAuthToken(token: string) {
    persistAuthToken(token);
    set({
      authToken: token,
      error: null,
    });
  },

  async createConversation() {
    set({ error: null });

    try {
      const conversation = await conversationService.create('New Chat');

      set((state) => ({
        citations: [],
        conversationId: conversation.id,
        conversations: [conversation, ...state.conversations],
        messages: [],
        streamingMessage: null,
        trace: [],
      }));
    } catch (error) {
      set({
        error: toErrorMessage(error),
      });
    }
  },

  async selectConversation(conversationId: string) {
    set({
      citations: [],
      conversationId,
      error: null,
      streamingMessage: null,
      trace: [],
    });

    try {
      const messages = await conversationService.listMessages(conversationId);

      set({
        messages: messages.map(mapConversationMessage),
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
      });
    }
  },

  async deleteConversation(conversationId: string) {
    set({ error: null });

    try {
      await conversationService.delete(conversationId);

      const conversations = get().conversations.filter(
        (conversation) => conversation.id !== conversationId,
      );
      const nextConversation = conversations[0] ?? null;

      set({
        conversationId: nextConversation?.id ?? null,
        conversations,
        messages: [],
      });

      if (nextConversation) {
        await get().selectConversation(nextConversation.id);
      }
    } catch (error) {
      set({
        error: toErrorMessage(error),
      });
    }
  },

  async sendMessage(question: string) {
    const normalizedQuestion = question.trim();

    if (!normalizedQuestion || get().streaming) {
      return;
    }

    let conversationId = get().conversationId;

    if (!conversationId) {
      await get().createConversation();
      conversationId = get().conversationId;
    }

    if (!conversationId) {
      set({
        error: 'Conversation is not available',
      });
      return;
    }

    const userMessage: ChatMessage = {
      content: normalizedQuestion,
      createdAt: new Date().toISOString(),
      id: createMessageId(),
      role: 'user',
      status: 'done',
    };
    const assistantMessage: ChatMessage = {
      content: '',
      createdAt: new Date().toISOString(),
      id: createMessageId(),
      role: 'assistant',
      status: 'streaming',
    };

    set((state) => ({
      citations: [],
      error: null,
      messages: [...state.messages, userMessage],
      streaming: true,
      streamingMessage: assistantMessage,
      trace: [createTraceItem('planner', 'Planning', 'running')],
    }));

    try {
      for await (const event of agentService.streamChat({
        conversationId,
        question: normalizedQuestion,
      })) {
        handleAgentEvent(event, set);
      }
    } catch (error) {
      const message = toErrorMessage(error);

      set((state) => ({
        error: message,
        messages: [
          ...state.messages,
          {
            ...assistantMessage,
            content: message,
            status: 'error',
          },
        ],
        streaming: false,
        streamingMessage: null,
      }));
    }
  },
}));

const handleAgentEvent = (event: AgentEvent, set: ChatStoreSet): void => {
  switch (event.type) {
    case 'thought': {
      const data = event.data as ThoughtEventData;

      set((state) => ({
        trace: upsertTrace(
          upsertTrace(
            state.trace,
            createTraceItem(
              'planner',
              'Planning',
              'success',
              data.needsGraph ? 'Graph enabled' : 'Retrieval only',
            ),
          ),
          createTraceItem('retrieval', 'Retrieval', data.needsRetrieval ? 'running' : 'skipped'),
        ),
      }));
      break;
    }
    case 'retrieval': {
      const data = event.data as RetrievalEventData;

      set((state) => ({
        trace: upsertTrace(
          state.trace,
          createTraceItem('retrieval', 'Retrieval', 'success', `${data.count} chunks`),
        ),
      }));
      break;
    }
    case 'graph': {
      const data = event.data as RetrievalEventData;

      set((state) => ({
        trace: upsertTrace(
          state.trace,
          createTraceItem('graph', 'Graph Search', 'success', `${data.count} relations`),
        ),
      }));
      break;
    }
    case 'token': {
      const data = event.data as TokenEventData;

      set((state) => ({
        streamingMessage: state.streamingMessage
          ? {
              ...state.streamingMessage,
              content: `${state.streamingMessage.content}${data.token}`,
            }
          : state.streamingMessage,
      }));
      break;
    }
    case 'citation': {
      set((state) => ({
        citations: [...state.citations, event.data as AgentCitation],
      }));
      break;
    }
    case 'done': {
      const data = event.data as AgentResponse;

      set((state) => ({
        citations: data.citations,
        messages: state.streamingMessage
          ? [
              ...state.messages,
              {
                ...state.streamingMessage,
                content: state.streamingMessage.content || data.answer,
                status: 'done',
              },
            ]
          : state.messages,
        streaming: false,
        streamingMessage: null,
        trace: mapDoneTrace(data),
      }));
      break;
    }
    case 'error': {
      const data = event.data as ErrorEventData;

      set({
        error: data.message,
        streaming: false,
        streamingMessage: null,
      });
      break;
    }
  }
};
