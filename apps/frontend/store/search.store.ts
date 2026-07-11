'use client';

import { create } from 'zustand';
import { toUserFacingErrorMessage } from '@/lib/workbench-copy';
import { searchService } from '@/services/search.service';
import type { AgentCitation } from '@/types/agent';
import type {
  SearchHistoryItem,
  SearchMode,
  SearchRequest,
  SearchResponse,
  SearchSort,
} from '@/types/search';
import type { DocumentType } from '@/types/workbench';
import { useWorkbenchStore } from './workbench.store';

interface SearchState {
  answer: string;
  categoryId: string;
  citations: AgentCitation[];
  documentType: DocumentType | 'ALL';
  error: string | null;
  history: SearchHistoryItem[];
  limit: number;
  loading: boolean;
  mode: SearchMode;
  offset: number;
  query: string;
  response: SearchResponse | null;
  running: boolean;
  sort: SearchSort;
  tagId: string;
  nextPage: () => Promise<void>;
  previousPage: () => Promise<void>;
  reset: () => void;
  search: (options?: { offset?: number }) => Promise<void>;
  setCategoryId: (categoryId: string) => void;
  setDocumentType: (documentType: DocumentType | 'ALL') => void;
  setLimit: (limit: number) => void;
  setMode: (mode: SearchMode) => void;
  setQuery: (query: string) => void;
  setSort: (sort: SearchSort) => void;
  setTagId: (tagId: string) => void;
  useHistoryItem: (item: SearchHistoryItem) => void;
}

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toErrorMessage = (error: unknown): string =>
  toUserFacingErrorMessage(error, '搜索请求失败，请稍后重试。');

const normalizeLimit = (limit: number): number => Math.max(1, Math.min(50, Math.round(limit)));

const createRequest = (
  state: Pick<
    SearchState,
    'categoryId' | 'documentType' | 'limit' | 'offset' | 'query' | 'sort' | 'tagId'
  >,
  spaceId: string | null,
): SearchRequest => ({
  categoryId: state.categoryId || undefined,
  documentType: state.documentType === 'ALL' ? undefined : state.documentType,
  limit: state.limit,
  offset: state.offset,
  q: state.query.trim(),
  sort: state.sort,
  spaceId: spaceId ?? undefined,
  tagId: state.tagId || undefined,
});

export const useSearchStore = create<SearchState>((set, get) => ({
  documentType: 'ALL',
  answer: '',
  categoryId: '',
  citations: [],
  error: null,
  history: [],
  limit: 10,
  loading: false,
  mode: 'hybrid',
  offset: 0,
  query: '',
  response: null,
  running: false,
  sort: 'relevance',
  tagId: '',

  async nextPage() {
    const state = get();

    if (state.loading || !state.response || state.response.results.length < state.limit) {
      return;
    }

    await state.search({ offset: state.offset + state.limit });
  },

  async previousPage() {
    const state = get();

    if (state.loading || state.offset === 0) {
      return;
    }

    await state.search({ offset: Math.max(0, state.offset - state.limit) });
  },

  reset() {
    set({
      error: null,
      loading: false,
      offset: 0,
      query: '',
      response: null,
      running: false,
    });
  },

  async search(options) {
    const state = get();
    const query = state.query.trim();
    const selectedSpaceId = useWorkbenchStore.getState().selectedSpaceId;
    const offset = options?.offset ?? state.offset;

    if (!query || state.loading) {
      return;
    }

    set({
      error: null,
      loading: true,
      offset,
      running: true,
    });

    try {
      const request = createRequest({ ...state, offset, query }, selectedSpaceId);
      const response = await searchService.search(state.mode, request);
      const historyItem: SearchHistoryItem = {
        categoryId: request.categoryId,
        createdAt: new Date().toISOString(),
        citations: [],
        documentType: request.documentType,
        id: createId(),
        mode: state.mode,
        query,
        resultCount: response.results.length,
        sort: state.sort,
        spaceId: selectedSpaceId ?? undefined,
        tagId: request.tagId,
      };

      set((current) => ({
        error: null,
        history: offset === 0 ? [historyItem, ...current.history].slice(0, 10) : current.history,
        loading: false,
        response,
        running: false,
      }));
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loading: false,
        running: false,
      });
    }
  },

  setCategoryId(categoryId) {
    set({ categoryId, offset: 0 });
  },

  setDocumentType(documentType) {
    set({ documentType, offset: 0 });
  },

  setLimit(limit) {
    set({ limit: normalizeLimit(limit), offset: 0 });
  },

  setMode(mode) {
    set({ mode, offset: 0 });
  },

  setQuery(query) {
    set({ query, offset: 0 });
  },

  setSort(sort) {
    set({ offset: 0, sort });
  },

  setTagId(tagId) {
    set({ offset: 0, tagId });
  },

  useHistoryItem(item) {
    set({
      categoryId: item.categoryId ?? '',
      documentType: item.documentType ?? 'ALL',
      mode: item.mode,
      offset: 0,
      query: item.query,
      sort: item.sort,
      tagId: item.tagId ?? '',
    });
  },
}));
