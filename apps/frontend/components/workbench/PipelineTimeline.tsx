'use client';

import { useMemo } from 'react';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { PipelineEvent, PipelineJobStatus } from '@/types/workbench';

const jobStatusLabel: Record<PipelineJobStatus, string> = {
  CANCELED: 'Canceled',
  FAILED: 'Failed',
  RUNNING: 'Running',
  SUCCEEDED: 'Succeeded',
};

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
            {jobStatusLabel[selectedJob.status]}
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
                {new Date(job.createdAt).toLocaleString()} · {job.status}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {loadingPipeline ? <p className="workbench-empty">Loading pipeline...</p> : null}
      {!loadingPipeline && sortedEvents.length === 0 ? (
        <p className="workbench-empty">No pipeline events.</p>
      ) : null}

      <div className="pipeline-timeline">
        {sortedEvents.map((event) => {
          const metadata = formatMetadata(event.metadata);

          return (
            <article className="pipeline-event" key={event.id}>
              <span className={`pipeline-event__marker pipeline-event__marker--${event.status}`} />
              <div className="pipeline-event__body">
                <div className="pipeline-event__top">
                  <strong>{event.stage}</strong>
                  <span>{event.status}</span>
                </div>
                <div className="pipeline-event__meta">
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                  <span>{formatDuration(event.durationMs)}</span>
                </div>
                {event.errorMessage ? (
                  <p className="workbench-error workbench-error--inline">{event.errorMessage}</p>
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
