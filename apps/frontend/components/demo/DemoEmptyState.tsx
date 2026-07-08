'use client';

interface DemoEmptyStateProps {
  action?: string;
  title: string;
}

export function DemoEmptyState({ action, title }: DemoEmptyStateProps) {
  return (
    <div className="demo-empty-state">
      <strong>{title}</strong>
      {action ? <span>{action}</span> : null}
    </div>
  );
}
