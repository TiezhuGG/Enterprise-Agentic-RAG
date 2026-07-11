'use client';

interface AgentDebugEmptyStateProps {
  action?: string;
  title: string;
}

export function AgentDebugEmptyState({ action, title }: AgentDebugEmptyStateProps) {
  return (
    <div className="demo-empty-state">
      <strong>{title}</strong>
      {action ? <span>{action}</span> : null}
    </div>
  );
}
