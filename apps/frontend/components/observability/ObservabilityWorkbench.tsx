'use client';

import { useEffect } from 'react';
import { useObservabilityStore } from '@/store/observability.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import { ExecutionRunDetailPanel } from './ExecutionRunDetailPanel';
import { ExecutionRunList } from './ExecutionRunList';
import { ExecutionTimeline } from './ExecutionTimeline';
import { MetricsBreakdownPanel } from './MetricsBreakdownPanel';
import { ReadinessCheckPanel } from './ReadinessCheckPanel';

export function ObservabilityWorkbench() {
  const authToken = useWorkbenchStore((state) => state.authToken);
  const {
    error,
    executionRuns,
    initialize,
    loadExecutions,
    loadTimeline,
    loadingExecutions,
    loadingMetrics,
    loadingReadiness,
    loadingTimeline,
    metricsBreakdown,
    readiness,
    refresh,
    refreshMetrics,
    refreshReadiness,
    selectExecution,
    selectedExecutionId,
    selectedRun,
    timeline,
  } = useObservabilityStore();

  useEffect(() => {
    void initialize();
  }, [authToken, initialize]);

  return (
    <div className="observability-workbench">
      {error ? <div className="workbench-error">{error}</div> : null}

      <div className="observability-toolbar">
        <div>
          <h2>Observability</h2>
          <span>Readiness, metrics, and execution replay for the current user.</span>
        </div>
        <button
          className="workbench-button workbench-button--secondary"
          onClick={() => void refresh()}
          type="button"
        >
          Refresh All
        </button>
      </div>

      <div className="observability-top-grid">
        <ReadinessCheckPanel
          loading={loadingReadiness}
          onRefresh={() => void refreshReadiness()}
          readiness={readiness}
        />
        <MetricsBreakdownPanel
          breakdown={metricsBreakdown}
          loading={loadingMetrics}
          onRefresh={() => void refreshMetrics()}
        />
      </div>

      <div className="observability-grid">
        <ExecutionRunList
          authenticated={Boolean(authToken)}
          loading={loadingExecutions}
          onRefresh={() => void loadExecutions()}
          onSelect={(executionId) => void selectExecution(executionId)}
          runs={executionRuns}
          selectedExecutionId={selectedExecutionId}
        />
        <ExecutionTimeline
          events={timeline}
          loading={loadingTimeline}
          onRefresh={() => {
            if (selectedExecutionId) {
              void loadTimeline(selectedExecutionId);
            }
          }}
          selectedExecutionId={selectedExecutionId}
        />
        <ExecutionRunDetailPanel run={selectedRun} timelineCount={timeline.length} />
      </div>
    </div>
  );
}
