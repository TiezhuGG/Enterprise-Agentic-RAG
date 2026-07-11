'use client';

import { create } from 'zustand';
import { toUserFacingErrorMessage } from '@/lib/error-copy';
import { systemService } from '@/services/system.service';
import type { DemoHealth, DemoMetricsSummary, DemoReadiness } from '@/types/demo';

interface DemoStore {
  error: string | null;
  health: DemoHealth | null;
  lastCheckedAt: string | null;
  loading: boolean;
  metricsSummary: DemoMetricsSummary | null;
  readiness: DemoReadiness['status'] | 'unknown';
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
}

const toErrorMessage = (error: unknown): string =>
  toUserFacingErrorMessage(error, '系统健康检查失败，请稍后重试。');

export const useDemoStore = create<DemoStore>((set) => ({
  error: null,
  health: null,
  lastCheckedAt: null,
  loading: false,
  metricsSummary: null,
  readiness: 'unknown',

  async initialize() {
    await useDemoStore.getState().refresh();
  },

  async refresh() {
    set({
      error: null,
      loading: true,
    });

    try {
      const readiness = await systemService.getReadiness();

      set({
        error: null,
        health: readiness.health,
        lastCheckedAt: new Date().toISOString(),
        loading: false,
        metricsSummary: readiness.metricsSummary,
        readiness: readiness.status,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        health: null,
        lastCheckedAt: new Date().toISOString(),
        loading: false,
        metricsSummary: null,
        readiness: 'degraded',
      });
    }
  },
}));
