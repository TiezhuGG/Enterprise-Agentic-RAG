'use client';

import { useEffect } from 'react';
import { useAgentDebugStore } from '@/store/agent-debug.store';
import { AgentCitationInspector } from './AgentCitationInspector';
import { AgentEventTimeline } from './AgentEventTimeline';
import { AgentExecutionSummary } from './AgentExecutionSummary';
import { AgentRunForm } from './AgentRunForm';
import { AgentTokenStream } from './AgentTokenStream';
import { AgentTraceTimeline } from './AgentTraceTimeline';

export function AgentDebugWorkbench() {
  const {
    answer,
    citations,
    conversationId,
    conversations,
    error,
    events,
    executionId,
    finalResponse,
    graphCount,
    initialize,
    plannerDecision,
    question,
    retrievalCount,
    run,
    runConfig,
    running,
    selectConversation,
    setQuestion,
    trace,
    updateRunConfig,
  } = useAgentDebugStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <div className="agent-debug-workbench">
      {error ? <div className="workbench-error">{error}</div> : null}

      <AgentRunForm
        conversationId={conversationId}
        conversations={conversations}
        disabled={running}
        onConversationChange={selectConversation}
        onQuestionChange={setQuestion}
        onRun={() => void run()}
        onRunConfigChange={updateRunConfig}
        question={question}
        runConfig={runConfig}
      />

      <div className="agent-debug-grid">
        <div className="agent-debug-column">
          <AgentExecutionSummary
            executionId={executionId}
            finalResponse={finalResponse}
            graphCount={graphCount}
            plannerDecision={plannerDecision}
            retrievalCount={retrievalCount}
            running={running}
          />
          <AgentEventTimeline events={events} />
        </div>
        <div className="agent-debug-column agent-debug-column--wide">
          <AgentTokenStream answer={answer} running={running} />
          <AgentTraceTimeline trace={trace} />
        </div>
        <div className="agent-debug-column">
          <AgentCitationInspector citations={citations} />
        </div>
      </div>
    </div>
  );
}
