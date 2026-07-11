'use client';

import { create } from 'zustand';
import { toUserFacingErrorMessage } from '@/lib/error-copy';
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
  toUserFacingErrorMessage(error, '运维概览加载失败，请稍后重试。');

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
