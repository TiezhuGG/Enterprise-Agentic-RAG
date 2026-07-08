'use client';

import type { AgentDebugEventItem } from '@/store/agent-debug.store';

interface AgentEventTimelineProps {
  events: AgentDebugEventItem[];
}

export function AgentEventTimeline({ events }: AgentEventTimelineProps) {
  return (
    <section className="workbench-panel agent-debug-event-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>Event Stream</h2>
          <span>{events.length} events</span>
        </div>
      </div>

      {events.length === 0 ? <p className="workbench-empty">No events.</p> : null}

      <ol className="agent-debug-events">
        {events.map((event) => (
          <li className={`agent-debug-event agent-debug-event--${event.type}`} key={event.id}>
            <div className="agent-debug-event__top">
              <strong>{event.type}</strong>
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            <p>{event.summary}</p>
            <details>
              <summary>payload</summary>
              <pre>{event.payload}</pre>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
