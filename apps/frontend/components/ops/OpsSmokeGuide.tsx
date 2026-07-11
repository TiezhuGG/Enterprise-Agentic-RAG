'use client';

import { Terminal } from 'lucide-react';
import type { OpsAction } from '@/types/ops';

interface OpsSmokeGuideProps {
  actions: OpsAction[];
}

export function OpsSmokeGuide({ actions }: OpsSmokeGuideProps) {
  return (
    <section className="ops-panel">
      <header>
        <div>
          <h3>Smoke Guide</h3>
          <span>Run these commands from the server terminal, not from the browser.</span>
        </div>
        <Terminal />
      </header>
      <div className="ops-smoke-list">
        {actions.map((action) => (
          <article key={action.id}>
            <strong>{action.label}</strong>
            <code>{action.command}</code>
            <span>{action.description}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
