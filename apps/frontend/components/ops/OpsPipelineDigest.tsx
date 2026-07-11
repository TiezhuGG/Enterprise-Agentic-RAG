'use client';

import type { OpsCountByStatus, OpsPipelineJob } from '@/types/ops';

interface OpsPipelineDigestProps {
  counts: OpsCountByStatus[];
  jobs: OpsPipelineJob[];
}

const formatTime = (value: string): string => new Date(value).toLocaleString();

export function OpsPipelineDigest({ counts, jobs }: OpsPipelineDigestProps) {
  return (
    <section className="ops-panel">
      <header>
        <div>
          <h3>Pipeline Digest</h3>
          <span>Recent ingestion and processing jobs.</span>
        </div>
      </header>

      <div className="ops-status-row">
        {counts.length === 0 ? <span>No pipeline jobs</span> : null}
        {counts.map((item) => (
          <span
            className={`status-pill status-pill--${item.status.toLowerCase()}`}
            key={item.status}
          >
            {item.status}: {item.count}
          </span>
        ))}
      </div>

      <div className="ops-list">
        {jobs.map((job) => (
          <article className="ops-list-item" key={job.id}>
            <div>
              <strong>{job.document.title}</strong>
              <span>{job.space.name}</span>
            </div>
            <div>
              <span className={`status-pill status-pill--${job.status.toLowerCase()}`}>
                {job.status}
              </span>
              <small>{formatTime(job.startedAt)}</small>
            </div>
            {job.errorMessage ? <p>{job.errorMessage}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
