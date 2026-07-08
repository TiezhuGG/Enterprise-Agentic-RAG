'use client';

import type { DemoChecklistStep, DemoStepStatus } from '@/types/demo';

interface DemoChecklistProps {
  steps: DemoChecklistStep[];
}

const statusLabel: Record<DemoStepStatus, string> = {
  active: 'Active',
  blocked: 'Blocked',
  done: 'Done',
  pending: 'Pending',
};

export function DemoChecklist({ steps }: DemoChecklistProps) {
  return (
    <ol className="demo-checklist">
      {steps.map((step) => (
        <li className={`demo-checklist__item demo-checklist__item--${step.status}`} key={step.id}>
          <span className="demo-checklist__marker" aria-hidden="true" />
          <div>
            <div className="demo-checklist__top">
              <strong>{step.label}</strong>
              <span>{statusLabel[step.status]}</span>
            </div>
            <p>{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
