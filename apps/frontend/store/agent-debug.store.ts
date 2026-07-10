'use client';

import { create } from 'zustand';
import { getAuthToken } from '@/services/api-client';
import { agentService } from '@/services/agent.service';
import { conversationService } from '@/services/conversation.service';
import { useWorkbenchStore } from './workbench.store';
import type {
  AgentCitation,
  AgentEvent,
  AgentEventType,
  AgentResponse,
  AgentTraceEntry,
  CitationEventData,
  DoneEventData,
  ErrorEventData,
  GraphEventData,
  GraphReasoningPath,
  IterationEventData,
  RetrievalEventData,
  ThoughtEventData,
  TokenEventData,
  VerificationEventData,
} from '@/types/agent';
import type { Conversation } from '@/types/conversation';

export interface AgentDebugRunConfig {
  keywordLimit: number;
  limit: number;
  maxContextTokens: number;
  vectorLimit: number;
}

export interface AgentDebugPlannerDecision {
  needsGraph: boolean;
  needsRetrieval: boolean;
}

export interface AgentDebugEventItem {
  id: string;
  payload: string;
  summary: string;
  timestamp: string;
  type: AgentEventType;
}

interface AgentDebugStore {
  answer: string;
  authToken: string;
  citations: AgentCitation[];
  conversationId: string | null;
  conversations: Conversation[];
  error: string | null;
  events: AgentDebugEventItem[];
  executionId: string | null;
  graphCount: number | null;
  graphPaths: GraphReasoningPath[];
  plannerDecision: AgentDebugPlannerDecision | null;
  question: string;
  retrievalCount: number | null;
  runConfig: AgentDebugRunConfig;
  running: boolean;
  trace: AgentTraceEntry[];
  finalResponse: AgentResponse | null;
  initialize: () => Promise<void>;
  run: () => Promise<void>;
  selectConversation: (conversationId: string) => void;
  setQuestion: (question: string) => void;
  updateRunConfig: (config: Partial<AgentDebugRunConfig>) => void;
}

const defaultRunConfig: AgentDebugRunConfig = {
  keywordLimit: 8,
  limit: 8,
  maxContextTokens: 3000,
  vectorLimit: 8,
};

const createEventId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Agent debug request failed';

const truncate = (value: string, maxLength = 180): string =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const safePayload = (data: unknown): string => {
  try {
    return truncate(JSON.stringify(data, null, 2), 600);
  } catch {
    return '[unserializable]';
  }
};

const summarizeEvent = (event: AgentEvent): string => {
  switch (event.type) {
    case 'thought': {
      const data = event.data as ThoughtEventData;

      return `retrieval=${String(data.needsRetrieval)} graph=${String(data.needsGraph)}`;
    }
    case 'iteration': {
      const data = event.data as IterationEventData;

      return `iteration ${data.iteration}/${data.maxIterations}`;
    }
    case 'retrieval': {
      const data = event.data as RetrievalEventData;

      return `${data.count} retrieval chunks`;
    }
    case 'graph': {
      const data = event.data as GraphEventData;

      return `${data.count} graph contexts / ${data.paths?.length ?? 0} paths`;
    }
    case 'token': {
      const data = event.data as TokenEventData;

      return truncate(data.token.replace(/\s+/g, ' ').trim() || '[whitespace]', 80);
    }
    case 'verification': {
      const data = event.data as VerificationEventData;

      return `verified=${String(data.verified)} moreContext=${String(data.needsMoreContext)} reason=${data.reason ?? '-'}`;
    }
    case 'citation': {
      const data = event.data as CitationEventData;

      return truncate(`${data.documentId} / ${data.chunkId}`, 120);
    }
    case 'done': {
      const data = event.data as DoneEventData;

      return `verified=${String(data.metadata.verified)} citations=${data.citations.length}`;
    }
    case 'error': {
      const data = event.data as ErrorEventData;

      return data.message;
    }
  }
};

const createTimelineItem = (event: AgentEvent): AgentDebugEventItem => ({
  id: createEventId(),
  payload: safePayload(event.data),
  summary: summarizeEvent(event),
  timestamp: new Date().toISOString(),
  type: event.type,
});

const resetRunState = () => ({
  answer: '',
  citations: [],
  error: null,
  events: [],
  executionId: null,
  finalResponse: null,
  graphCount: null,
  graphPaths: [],
  plannerDecision: null,
  retrievalCount: null,
  trace: [],
});

const ensureDebugConversation = async (): Promise<{
  conversationId: string;
  conversations: Conversation[];
}> => {
  const conversations = await conversationService.list();
  const activeConversation =
    conversations[0] ?? (await conversationService.create('Debug Session'));

  return {
    conversationId: activeConversation.id,
    conversations: conversations.length > 0 ? conversations : [activeConversation],
  };
};

export const useAgentDebugStore = create<AgentDebugStore>((set, get) => ({
  answer: '',
  authToken: '',
  citations: [],
  conversationId: null,
  conversations: [],
  error: null,
  events: [],
  executionId: null,
  finalResponse: null,
  graphCount: null,
  graphPaths: [],
  plannerDecision: null,
  question: '',
  retrievalCount: null,
  runConfig: defaultRunConfig,
  running: false,
  trace: [],

  async initialize() {
    set({
      authToken: getAuthToken(),
      error: null,
    });

    try {
      const { conversationId, conversations } = await ensureDebugConversation();

      set({
        conversationId,
        conversations,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
      });
    }
  },

  async run() {
    const conversationId = get().conversationId;
    const question = get().question.trim();
    const runConfig = get().runConfig;

    if (!conversationId) {
      set({ error: 'Debug conversation is unavailable.' });
      return;
    }

    if (!question) {
      set({ error: 'Question is required.' });
      return;
    }

    set({
      ...resetRunState(),
      running: true,
    });

    try {
      const selectedSpaceId = useWorkbenchStore.getState().selectedSpaceId;

      for await (const event of agentService.streamChat({
        conversationId,
        question,
        spaceIds: selectedSpaceId ? [selectedSpaceId] : undefined,
        ...runConfig,
      })) {
        const timelineItem = createTimelineItem(event);

        set((state) => ({
          events: [...state.events, timelineItem],
        }));

        switch (event.type) {
          case 'thought': {
            const data = event.data as ThoughtEventData;

            set({
              executionId: data.executionId,
              plannerDecision: {
                needsGraph: data.needsGraph,
                needsRetrieval: data.needsRetrieval,
              },
            });
            break;
          }
          case 'iteration': {
            const data = event.data as IterationEventData;

            set({
              executionId: data.executionId,
            });
            break;
          }
          case 'retrieval': {
            const data = event.data as RetrievalEventData;

            set({
              executionId: data.executionId,
              retrievalCount: data.count,
            });
            break;
          }
          case 'graph': {
            const data = event.data as GraphEventData;

            set({
              executionId: data.executionId,
              graphCount: data.count,
              graphPaths: data.paths ?? [],
            });
            break;
          }
          case 'token': {
            const data = event.data as TokenEventData;

            set((state) => ({
              answer: `${state.answer}${data.token}`,
              executionId: data.executionId,
            }));
            break;
          }
          case 'verification': {
            const data = event.data as VerificationEventData;

            set({
              executionId: data.executionId,
            });
            break;
          }
          case 'citation': {
            const data = event.data as CitationEventData;

            set((state) => ({
              citations: [...state.citations, data],
            }));
            break;
          }
          case 'done': {
            const data = event.data as DoneEventData;

            set({
              answer: data.answer,
              citations: data.citations,
              executionId: data.executionId,
              finalResponse: data,
              trace: data.metadata.trace,
            });
            break;
          }
          case 'error': {
            const data = event.data as ErrorEventData;

            set({
              error: data.message,
              running: false,
            });
            return;
          }
        }
      }

      set({ running: false });
    } catch (error) {
      const message = toErrorMessage(error);
      const errorEvent: AgentEvent<ErrorEventData> = {
        data: {
          message,
        },
        type: 'error',
      };

      set((state) => ({
        error: message,
        events: [...state.events, createTimelineItem(errorEvent)],
        running: false,
      }));
    }
  },

  selectConversation(conversationId: string) {
    set({
      ...resetRunState(),
      conversationId,
      running: false,
    });
  },

  setQuestion(question: string) {
    set({ question });
  },

  updateRunConfig(config: Partial<AgentDebugRunConfig>) {
    set((state) => ({
      runConfig: {
        ...state.runConfig,
        ...config,
      },
    }));
  },
}));
