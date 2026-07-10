'use client';

import { useMemo } from 'react';
import { DemoEmptyState } from '@/components/demo';
import {
  getPipelineEventErrorDetail,
  getPipelineEventErrorMessage,
  getPipelineStageDescription,
  getPipelineStageLabel,
  pipelineEventStatusLabels,
  pipelineJobStatusLabels,
} from '@/lib/workbench-copy';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { PipelineEvent } from '@/types/workbench';

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  return `${(durationMs / 1000).toFixed(2)} s`;
};

const formatMetadata = (metadata: Record<string, unknown>): string => {
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return '';
  }

  return JSON.stringify(Object.fromEntries(entries), null, 2);
};

const sortEvents = (events: PipelineEvent[]): PipelineEvent[] =>
  [...events].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

export function PipelineTimeline() {
  const loadingPipeline = useWorkbenchStore((state) => state.loadingPipeline);
  const pipelineEvents = useWorkbenchStore((state) => state.pipelineEvents);
  const pipelineJobs = useWorkbenchStore((state) => state.pipelineJobs);
  const selectedPipelineJobId = useWorkbenchStore((state) => state.selectedPipelineJobId);
  const selectPipelineJob = useWorkbenchStore((state) => state.selectPipelineJob);
  const sortedEvents = useMemo(() => sortEvents(pipelineEvents), [pipelineEvents]);
  const selectedJob = pipelineJobs.find((job) => job.id === selectedPipelineJobId) ?? null;

  return (
    <section className="workbench-panel pipeline-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Pipeline Timeline</h2>
          <span>{pipelineJobs.length} jobs</span>
        </div>
        {selectedJob ? (
          <span className={`status-pill status-pill--${selectedJob.status.toLowerCase()}`}>
            {pipelineJobStatusLabels[selectedJob.status]}
          </span>
        ) : null}
      </div>

      {pipelineJobs.length > 1 ? (
        <label className="workbench-field" htmlFor="pipeline-job">
          <span>Job</span>
          <select
            className="workbench-select"
            id="pipeline-job"
            onChange={(event) => void selectPipelineJob(event.target.value)}
            value={selectedPipelineJobId ?? ''}
          >
            {pipelineJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {new Date(job.createdAt).toLocaleString()} | {pipelineJobStatusLabels[job.status]}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {loadingPipeline ? <p className="workbench-empty">Loading pipeline...</p> : null}
      {!loadingPipeline && sortedEvents.length === 0 ? (
        <DemoEmptyState
          title="No Pipeline Events"
          action="Run ingestion for the selected document."
        />
      ) : null}

      <div className="pipeline-timeline">
        {sortedEvents.map((event) => {
          const metadata = formatMetadata(event.metadata);
          const errorMessage = event.errorMessage ? getPipelineEventErrorMessage(event) : '';
          const errorDetail = event.errorMessage ? getPipelineEventErrorDetail(event) : '';

          return (
            <article className="pipeline-event" key={event.id}>
              <span className={`pipeline-event__marker pipeline-event__marker--${event.status}`} />
              <div className="pipeline-event__body">
                <div className="pipeline-event__top">
                  <strong>{getPipelineStageLabel(event.stage)}</strong>
                  <span>{pipelineEventStatusLabels[event.status]}</span>
                </div>
                <div className="pipeline-event__meta">
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                  <span>{formatDuration(event.durationMs)}</span>
                  <span>{event.stage}</span>
                </div>
                <p className="pipeline-event__description">
                  {getPipelineStageDescription(event.stage)}
                </p>
                {event.errorMessage ? (
                  <div className="workbench-error workbench-error--inline">
                    <strong>{errorMessage}</strong>
                    {errorDetail ? <span>{errorDetail}</span> : null}
                  </div>
                ) : null}
                {metadata ? (
                  <details className="pipeline-event__details">
                    <summary>metadata</summary>
                    <pre>{metadata}</pre>
                  </details>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
