'use client';

import { create } from 'zustand';
import { getAuthToken } from '@/services/api-client';
import { opsService } from '@/services/ops.service';
import type { OpsSummary } from '@/types/ops';

interface OpsState {
  error: string | null;
  loading: boolean;
  summary: OpsSummary | null;
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ops summary request failed';

export const useOpsStore = create<OpsState>((set) => ({
  error: null,
  loading: false,
  summary: null,

  async initialize() {
    if (!getAuthToken()) {
      set({
        error: null,
        loading: false,
        summary: null,
      });
      return;
    }

    await useOpsStore.getState().refresh();
  },

  async refresh() {
    if (!getAuthToken()) {
      set({
        error: null,
        loading: false,
        summary: null,
      });
      return;
    }

    set({ error: null, loading: true });

    try {
      const summary = await opsService.getSummary();

      set({
        loading: false,
        summary,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loading: false,
      });
    }
  },
}));
