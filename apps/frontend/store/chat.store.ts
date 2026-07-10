'use client';

import { create } from 'zustand';
import { getAuthToken, setAuthToken as persistAuthToken } from '@/services/api-client';
import { agentService } from '@/services/agent.service';
import { conversationService } from '@/services/conversation.service';
import { multimodalService } from '@/services/multimodal.service';
import type {
  AgentCitation,
  AgentEvent,
  AgentResponse,
  AgentTraceEntry,
  AgentVerificationResult,
  ErrorEventData,
  RetrievalEventData,
  ThoughtEventData,
  TokenEventData,
} from '@/types/agent';
import type { Conversation, ConversationMessage } from '@/types/conversation';
import type { MultimodalAttachment, MultimodalAttachmentType } from '@/types/multimodal';
import { useWorkbenchStore } from './workbench.store';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  attachments?: ChatMessageAttachment[];
  citations?: AgentCitation[];
  status?: 'streaming' | 'done' | 'error';
  verificationResult?: AgentVerificationResult | null;
  verified?: boolean;
}

export interface ChatMessageAttachment {
  id: string;
  filename: string;
  type?: MultimodalAttachmentType;
}

export interface ChatAttachment {
  clientId: string;
  id?: string;
  filename: string;
  size: number;
  type?: MultimodalAttachmentType;
  status: 'uploading' | 'ready' | 'error';
  error?: string;
}

export interface AgentTraceItem {
  node: string;
  label: string;
  status: AgentTraceEntry['status'] | 'running';
  detail?: string;
}

interface ChatStore {
  authToken: string;
  attachments: ChatAttachment[];
  conversationId: string | null;
  conversations: Conversation[];
  messages: ChatMessage[];
  streaming: boolean;
  streamingMessage: ChatMessage | null;
  trace: AgentTraceItem[];
  citations: AgentCitation[];
  verificationResult: AgentVerificationResult | null;
  verified: boolean | null;
  error: string | null;
  initialize: () => Promise<void>;
  setAuthToken: (token: string) => void;
  createConversation: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  removeAttachment: (clientId: string) => void;
  sendMessage: (question: string) => Promise<void>;
  uploadAttachment: (file: File) => Promise<void>;
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
  answer: '生成回答',
  graph: '图谱检索',
  memory: '记忆上下文',
  planner: '问题规划',
  retrieval: '知识检索',
  verification: '答案校验',
};

const mapTraceEntry = (entry: AgentTraceEntry): AgentTraceItem =>
  createTraceItem(entry.node, traceLabels[entry.node] ?? entry.node, entry.status);

const isAgentCitation = (value: unknown): value is AgentCitation => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const citation = value as Partial<AgentCitation>;

  return (
    typeof citation.chunkId === 'string' &&
    typeof citation.content === 'string' &&
    typeof citation.documentId === 'string' &&
    typeof citation.score === 'number'
  );
};

const readMessageCitations = (metadata: Record<string, unknown>): AgentCitation[] => {
  const citations = metadata.citations;

  return Array.isArray(citations) ? citations.filter(isAgentCitation) : [];
};

const readVerificationResult = (
  metadata: Record<string, unknown>,
): AgentVerificationResult | null => {
  const verificationResult = metadata.verificationResult;

  return verificationResult && typeof verificationResult === 'object'
    ? (verificationResult as AgentVerificationResult)
    : null;
};

const mapConversationMessage = (message: ConversationMessage): ChatMessage => {
  const role = message.role.toLowerCase() as ChatMessageRole;

  return {
    citations: role === 'assistant' ? readMessageCitations(message.metadata) : undefined,
    content: message.content,
    createdAt: message.createdAt,
    id: message.id,
    role,
    status: 'done',
    verificationResult: role === 'assistant' ? readVerificationResult(message.metadata) : undefined,
    verified:
      role === 'assistant' && typeof message.metadata.verified === 'boolean'
        ? message.metadata.verified
        : undefined,
  };
};

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

const mapAttachment = (attachment: MultimodalAttachment): ChatAttachment => ({
  clientId: attachment.id,
  filename: attachment.filename,
  id: attachment.id,
  size: attachment.size,
  status: 'ready',
  type: attachment.type,
});

export const useChatStore = create<ChatStore>((set, get) => ({
  attachments: [],
  authToken: '',
  citations: [],
  conversationId: null,
  conversations: [],
  error: null,
  messages: [],
  streaming: false,
  streamingMessage: null,
  trace: [],
  verificationResult: null,
  verified: null,

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
        attachments: [],
        citations: [],
        conversationId: conversation.id,
        conversations: [conversation, ...state.conversations],
        messages: [],
        streamingMessage: null,
        trace: [],
        verificationResult: null,
        verified: null,
      }));
    } catch (error) {
      set({
        error: toErrorMessage(error),
      });
    }
  },

  async selectConversation(conversationId: string) {
    set({
      attachments: [],
      citations: [],
      conversationId,
      error: null,
      streamingMessage: null,
      trace: [],
      verificationResult: null,
      verified: null,
    });

    try {
      const messages = await conversationService.listMessages(conversationId);
      const mappedMessages = messages.map(mapConversationMessage);
      const latestAssistantWithCitations = [...mappedMessages]
        .reverse()
        .find((message) => message.role === 'assistant' && message.citations?.length);

      set({
        citations: latestAssistantWithCitations?.citations ?? [],
        messages: mappedMessages,
        verificationResult: latestAssistantWithCitations?.verificationResult ?? null,
        verified: latestAssistantWithCitations?.verified ?? null,
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
        attachments: [],
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

  removeAttachment(clientId: string) {
    set((state) => ({
      attachments: state.attachments.filter((attachment) => attachment.clientId !== clientId),
    }));
  },

  async uploadAttachment(file: File) {
    if (get().streaming) {
      return;
    }

    let conversationId = get().conversationId;

    if (!conversationId) {
      await get().createConversation();
      conversationId = get().conversationId;
    }

    const clientId = createMessageId();
    const pendingAttachment: ChatAttachment = {
      clientId,
      filename: file.name,
      size: file.size,
      status: 'uploading',
    };

    set((state) => ({
      attachments: [...state.attachments, pendingAttachment],
      error: null,
    }));

    try {
      const attachment = await multimodalService.uploadAttachment(
        file,
        conversationId ?? undefined,
      );

      set((state) => ({
        attachments: state.attachments.map((item) =>
          item.clientId === clientId ? mapAttachment(attachment) : item,
        ),
      }));
    } catch (error) {
      const message = toErrorMessage(error);

      set((state) => ({
        attachments: state.attachments.map((item) =>
          item.clientId === clientId
            ? {
                ...item,
                error: message,
                status: 'error',
              }
            : item,
        ),
        error: message,
      }));
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

    const attachments = get().attachments;
    const hasUploadingAttachment = attachments.some(
      (attachment) => attachment.status === 'uploading',
    );

    if (hasUploadingAttachment) {
      set({
        error: 'Attachment upload is still in progress',
      });
      return;
    }

    const readyAttachments = attachments.filter(
      (attachment): attachment is ChatAttachment & { id: string } =>
        attachment.status === 'ready' && Boolean(attachment.id),
    );

    const userMessage: ChatMessage = {
      attachments: readyAttachments.map((attachment) => ({
        filename: attachment.filename,
        id: attachment.id,
        type: attachment.type,
      })),
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
      trace: [createTraceItem('planner', '问题规划', 'running')],
      verificationResult: null,
      verified: null,
    }));

    try {
      const selectedSpaceId = useWorkbenchStore.getState().selectedSpaceId;

      for await (const event of agentService.streamChat({
        attachmentIds: readyAttachments.map((attachment) => attachment.id),
        conversationId,
        question: normalizedQuestion,
        spaceIds: selectedSpaceId ? [selectedSpaceId] : undefined,
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
              '问题规划',
              'success',
              data.needsGraph ? '已启用图谱检索' : '仅使用知识检索',
            ),
          ),
          createTraceItem('retrieval', '知识检索', data.needsRetrieval ? 'running' : 'skipped'),
        ),
      }));
      break;
    }
    case 'retrieval': {
      const data = event.data as RetrievalEventData;

      set((state) => ({
        trace: upsertTrace(
          state.trace,
          createTraceItem('retrieval', '知识检索', 'success', `${data.count} 个片段`),
        ),
      }));
      break;
    }
    case 'graph': {
      const data = event.data as RetrievalEventData;

      set((state) => ({
        trace: upsertTrace(
          state.trace,
          createTraceItem('graph', '图谱检索', 'success', `${data.count} 条关系`),
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
        attachments: [],
        citations: data.citations,
        messages: state.streamingMessage
          ? [
              ...state.messages,
              {
                ...state.streamingMessage,
                content: state.streamingMessage.content || data.answer,
                citations: data.citations,
                status: 'done',
                verificationResult: data.metadata.verificationResult,
                verified: data.metadata.verified,
              },
            ]
          : state.messages,
        streaming: false,
        streamingMessage: null,
        trace: mapDoneTrace(data),
        verificationResult: data.metadata.verificationResult,
        verified: data.metadata.verified,
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
