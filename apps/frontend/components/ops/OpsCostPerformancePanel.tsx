'use client';

import { Gauge, ReceiptText } from 'lucide-react';
import type { OpsCostSummary, OpsPerformanceSummary } from '@/types/ops';

interface OpsCostPerformancePanelProps {
  cost: OpsCostSummary;
  performance: OpsPerformanceSummary;
}

const formatCost = (value: number, currency: string): string =>
  `${currency} ${value.toFixed(value >= 1 ? 2 : 6)}`;

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return '-';
  }

  return durationMs < 1000 ? `${durationMs} ms` : `${(durationMs / 1000).toFixed(2)} s`;
};

const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);

export function OpsCostPerformancePanel({ cost, performance }: OpsCostPerformancePanelProps) {
  return (
    <section className="ops-panel ops-cost-panel">
      <header>
        <div>
          <h3>Cost & Performance</h3>
          <span>Estimated token cost and execution latency.</span>
        </div>
        <ReceiptText />
      </header>

      <div className="ops-cost-summary">
        <article>
          <strong>{formatCost(cost.totalEstimatedCost, cost.currency)}</strong>
          <span>estimated cost</span>
        </article>
        <article>
          <strong>{formatNumber(cost.totalTokens)}</strong>
          <span>total tokens</span>
        </article>
        <article>
          <strong>{formatDuration(performance.p95DurationMs)}</strong>
          <span>P95 latency</span>
        </article>
        <article>
          <strong>{performance.slowExecutions}</strong>
          <span>slow executions</span>
        </article>
      </div>

      <div className="ops-token-split">
        <span>Prompt {formatNumber(cost.promptTokens)}</span>
        <span>Output {formatNumber(cost.outputTokens)}</span>
        <span>Avg {formatDuration(performance.averageDurationMs)}</span>
      </div>

      <div className="ops-model-costs">
        {cost.byModel.length === 0 ? <span>No model cost events yet.</span> : null}
        {cost.byModel.map((item) => (
          <div key={item.model}>
            <strong>{item.model}</strong>
            <span>{formatNumber(item.totalTokens)} tokens</span>
            <em>{formatCost(item.estimatedCost, cost.currency)}</em>
          </div>
        ))}
      </div>

      <div className="ops-node-latency">
        <div className="ops-node-latency__title">
          <Gauge />
          <span>Node latency</span>
        </div>
        {performance.nodeLatency.length === 0 ? <span>No node latency events yet.</span> : null}
        {performance.nodeLatency.map((item) => (
          <div key={item.node}>
            <strong>{item.node}</strong>
            <span>avg {formatDuration(item.averageDurationMs)}</span>
            <span>max {formatDuration(item.maxDurationMs)}</span>
            <em>{item.count}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
