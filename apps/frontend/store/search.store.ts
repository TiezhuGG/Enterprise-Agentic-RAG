'use client';

import { create } from 'zustand';
import { agentService } from '@/services/agent.service';
import { conversationService } from '@/services/conversation.service';
import type {
  AgentCitation,
  AgentEvent,
  DoneEventData,
  ErrorEventData,
  TokenEventData,
} from '@/types/agent';
import { useWorkbenchStore } from './workbench.store';

export interface SearchHistoryItem {
  answer: string;
  citations: AgentCitation[];
  createdAt: string;
  id: string;
  query: string;
}

interface SearchState {
  answer: string;
  citations: AgentCitation[];
  conversationId: string | null;
  error: string | null;
  history: SearchHistoryItem[];
  query: string;
  running: boolean;
  setQuery: (query: string) => void;
  reset: () => void;
  search: () => Promise<void>;
}

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : '搜索请求失败';

export const useSearchStore = create<SearchState>((set, get) => ({
  answer: '',
  citations: [],
  conversationId: null,
  error: null,
  history: [],
  query: '',
  running: false,

  reset() {
    set({
      answer: '',
      citations: [],
      error: null,
      query: '',
      running: false,
    });
  },

  setQuery(query: string) {
    set({ query });
  },

  async search() {
    const query = get().query.trim();

    if (!query || get().running) {
      return;
    }

    set({
      answer: '',
      citations: [],
      error: null,
      running: true,
    });

    try {
      let conversationId = get().conversationId;

      if (!conversationId) {
        const conversation = await conversationService.create('智能搜索');
        conversationId = conversation.id;
        set({ conversationId });
      }

      const selectedSpaceId = useWorkbenchStore.getState().selectedSpaceId;
      let finalAnswer = '';
      let finalCitations: AgentCitation[] = [];

      for await (const event of agentService.streamChat({
        conversationId,
        question: query,
        spaceIds: selectedSpaceId ? [selectedSpaceId] : undefined,
      })) {
        handleSearchEvent(event, set);

        if (event.type === 'done') {
          const data = event.data as DoneEventData;
          finalAnswer = data.answer;
          finalCitations = data.citations;
        }
      }

      const state = get();
      const answer = finalAnswer || state.answer;
      const citations = finalCitations.length > 0 ? finalCitations : state.citations;

      set({
        answer,
        citations,
        history: [
          {
            answer,
            citations,
            createdAt: new Date().toISOString(),
            id: createId(),
            query,
          },
          ...state.history,
        ].slice(0, 10),
        running: false,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        running: false,
      });
    }
  },
}));

const handleSearchEvent = (
  event: AgentEvent,
  set: (
    partial: Partial<SearchState> | ((state: SearchState) => Partial<SearchState>),
  ) => void,
): void => {
  switch (event.type) {
    case 'token': {
      const data = event.data as TokenEventData;

      set((state) => ({
        answer: `${state.answer}${data.token}`,
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
      const data = event.data as DoneEventData;

      set({
        answer: data.answer,
        citations: data.citations,
        running: false,
      });
      break;
    }
    case 'error': {
      const data = event.data as ErrorEventData;

      set({
        error: data.message,
        running: false,
      });
      break;
    }
  }
};
