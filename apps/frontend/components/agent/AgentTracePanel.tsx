'use client';

import type { AgentTraceItem } from '@/store/chat.store';

interface AgentTracePanelProps {
  trace: AgentTraceItem[];
}

const statusLabel: Record<AgentTraceItem['status'], string> = {
  failed: 'Failed',
  running: 'Running',
  skipped: 'Skipped',
  success: 'Done',
};

export function AgentTracePanel({ trace }: AgentTracePanelProps) {
  return (
    <aside className="agent-panel" aria-label="Agent trace">
      <header className="agent-panel__header">
        <h2>Agent Trace</h2>
      </header>
      <ol className="agent-trace">
        {trace.length === 0 ? (
          <li className="agent-trace__empty">No active trace</li>
        ) : (
          trace.map((item) => (
            <li className={`agent-trace__item agent-trace__item--${item.status}`} key={item.node}>
              <span className="agent-trace__status" aria-hidden="true" />
              <div>
                <strong>{item.label}</strong>
                <span>{item.detail ?? statusLabel[item.status]}</span>
              </div>
            </li>
          ))
        )}
      </ol>
    </aside>
  );
}
