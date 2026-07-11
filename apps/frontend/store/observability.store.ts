'use client';

import { create } from 'zustand';
import { toUserFacingErrorMessage } from '@/lib/error-copy';
import { getAuthToken } from '@/services/api-client';
import { executionService } from '@/services/execution.service';
import { observabilityService } from '@/services/observability.service';
import type {
  ExecutionRun,
  ExecutionTraceEvent,
  MetricsBreakdown,
  ReadinessResponse,
} from '@/types/observability';

interface ObservabilityState {
  error: string | null;
  executionRuns: ExecutionRun[];
  loadingExecutions: boolean;
  loadingMetrics: boolean;
  loadingReadiness: boolean;
  loadingTimeline: boolean;
  metricsBreakdown: MetricsBreakdown | null;
  metricsText: string;
  readiness: ReadinessResponse | null;
  selectedExecutionId: string | null;
  selectedRun: ExecutionRun | null;
  timeline: ExecutionTraceEvent[];
  initialize: () => Promise<void>;
  loadExecutions: (limit?: number) => Promise<void>;
  loadTimeline: (executionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshReadiness: () => Promise<void>;
  selectExecution: (executionId: string) => Promise<void>;
  selectLatestExecution: () => Promise<void>;
}

const toErrorMessage = (error: unknown): string =>
  toUserFacingErrorMessage(error, '可观测性数据加载失败，请稍后重试。');

const sortRuns = (runs: ExecutionRun[]): ExecutionRun[] =>
  [...runs].sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
  );

const sortTimeline = (events: ExecutionTraceEvent[]): ExecutionTraceEvent[] =>
  [...events].sort((left, right) => left.sequence - right.sequence);

export const useObservabilityStore = create<ObservabilityState>((set, get) => ({
  error: null,
  executionRuns: [],
  loadingExecutions: false,
  loadingMetrics: false,
  loadingReadiness: false,
  loadingTimeline: false,
  metricsBreakdown: null,
  metricsText: '',
  readiness: null,
  selectedExecutionId: null,
  selectedRun: null,
  timeline: [],

  async initialize() {
    await Promise.allSettled([get().refreshReadiness(), get().refreshMetrics()]);

    if (getAuthToken()) {
      await get().loadExecutions();
      return;
    }

    set({
      executionRuns: [],
      selectedExecutionId: null,
      selectedRun: null,
      timeline: [],
    });
  },

  async loadExecutions(limit = 20) {
    if (!getAuthToken()) {
      set({
        executionRuns: [],
        loadingExecutions: false,
        selectedExecutionId: null,
        selectedRun: null,
        timeline: [],
      });
      return;
    }

    set({ error: null, loadingExecutions: true });

    try {
      const executionRuns = sortRuns(await executionService.listExecutions(limit));
      const currentExecutionId = get().selectedExecutionId;
      const selectedRun =
        executionRuns.find((run) => run.executionId === currentExecutionId) ?? null;

      set({
        executionRuns,
        loadingExecutions: false,
        selectedRun,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loadingExecutions: false,
      });
    }
  },

  async loadTimeline(executionId: string) {
    set({ error: null, loadingTimeline: true });

    try {
      const timeline = sortTimeline(await executionService.listTimeline(executionId));

      set({
        loadingTimeline: false,
        timeline,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loadingTimeline: false,
        timeline: [],
      });
    }
  },

  async refresh() {
    await Promise.allSettled([get().refreshReadiness(), get().refreshMetrics()]);
    await get().loadExecutions();

    const executionId = get().selectedExecutionId;

    if (executionId) {
      await get().selectExecution(executionId);
    }
  },

  async refreshMetrics() {
    set({ error: null, loadingMetrics: true });

    try {
      const metricsText = await observabilityService.getMetricsText();

      set({
        loadingMetrics: false,
        metricsBreakdown: observabilityService.parseMetricsBreakdown(metricsText),
        metricsText,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loadingMetrics: false,
        metricsBreakdown: null,
        metricsText: '',
      });
    }
  },

  async refreshReadiness() {
    set({ error: null, loadingReadiness: true });

    try {
      const readiness = await observabilityService.getReadiness();

      set({
        loadingReadiness: false,
        readiness,
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loadingReadiness: false,
        readiness: null,
      });
    }
  },

  async selectExecution(executionId: string) {
    set({
      error: null,
      loadingTimeline: true,
      selectedExecutionId: executionId,
    });

    try {
      const [run, timeline] = await Promise.all([
        executionService.getExecution(executionId),
        executionService.listTimeline(executionId),
      ]);

      set({
        loadingTimeline: false,
        selectedRun: run,
        timeline: sortTimeline(timeline),
      });
    } catch (error) {
      set({
        error: toErrorMessage(error),
        loadingTimeline: false,
      });
    }
  },

  async selectLatestExecution() {
    const latestExecutionId = get().executionRuns[0]?.executionId;

    if (!latestExecutionId) {
      return;
    }

    await get().selectExecution(latestExecutionId);
  },
}));
