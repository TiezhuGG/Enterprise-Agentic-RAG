'use client';

import type { AgentDebugEventItem } from '@/store/agent-debug.store';
import { AgentDebugEmptyState } from './AgentDebugEmptyState';

interface AgentEventTimelineProps {
  events: AgentDebugEventItem[];
}

export function AgentEventTimeline({ events }: AgentEventTimelineProps) {
  return (
    <section className="workbench-panel agent-debug-event-panel">
      <div className="workbench-panel__header">
        <div>
          <h2>事件流</h2>
          <span>{events.length} 个事件</span>
        </div>
      </div>

      {events.length === 0 ? (
        <AgentDebugEmptyState title="暂无事件" action="运行一次问题后会显示执行事件。" />
      ) : null}

      <ol className="agent-debug-events">
        {events.map((event) => (
          <li className={`agent-debug-event agent-debug-event--${event.type}`} key={event.id}>
            <div className="agent-debug-event__top">
              <strong>{event.type}</strong>
              <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
            </div>
            <p>{event.summary}</p>
            <details>
              <summary>事件数据</summary>
              <pre>{event.payload}</pre>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
