'use client';

import { RefreshCw } from 'lucide-react';
import { DemoEmptyState } from '@/components/demo';
import type { OpsSummary } from '@/types/ops';
import { OpsExecutionDigest } from './OpsExecutionDigest';
import { OpsOverviewCards } from './OpsOverviewCards';
import { OpsPipelineDigest } from './OpsPipelineDigest';
import { OpsReadinessMatrix } from './OpsReadinessMatrix';
import { OpsSmokeGuide } from './OpsSmokeGuide';

interface OpsConsoleProps {
  authenticated: boolean;
  error: string | null;
  loading: boolean;
  onRefresh: () => void;
  summary: OpsSummary | null;
}

export function OpsConsole({ authenticated, error, loading, onRefresh, summary }: OpsConsoleProps) {
  return (
    <section className="ops-console">
      <div className="ops-console__header">
        <div>
          <h2>Ops Console</h2>
          <span>
            {summary
              ? `Generated ${new Date(summary.generatedAt).toLocaleString()}`
              : 'Operational summary for demo readiness and troubleshooting.'}
          </span>
        </div>
        <button
          className="workbench-button workbench-button--secondary"
          disabled={!authenticated || loading}
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw />
          Refresh Ops
        </button>
      </div>

      {error ? <div className="workbench-error">{error}</div> : null}

      {!authenticated ? (
        <DemoEmptyState title="Login Required" action="Login to view operational summary." />
      ) : null}

      {authenticated && !summary && !loading ? (
        <DemoEmptyState title="No Ops Summary" action="Refresh operational summary." />
      ) : null}

      {loading ? <p className="workbench-empty">Loading ops summary...</p> : null}

      {summary ? (
        <>
          <OpsOverviewCards summary={summary} />
          <div className="ops-console__grid">
            <OpsReadinessMatrix checks={summary.readiness.checks} />
            <OpsPipelineDigest counts={summary.pipeline.byStatus} jobs={summary.pipeline.recent} />
            <OpsExecutionDigest
              counts={summary.executions.byStatus}
              runs={summary.executions.recent}
            />
            <OpsSmokeGuide actions={summary.actions} />
          </div>
        </>
      ) : null}
    </section>
  );
}
