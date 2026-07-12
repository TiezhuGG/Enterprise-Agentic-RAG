'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildConsoleHref } from '@/lib/console-routes';
import { useAgentDebugStore } from '@/store/agent-debug.store';
import { useObservabilityStore } from '@/store/observability.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import { AgentCitationInspector } from './AgentCitationInspector';
import { AgentEventTimeline } from './AgentEventTimeline';
import { AgentExecutionSummary } from './AgentExecutionSummary';
import { AgentGraphReasoningPath } from './AgentGraphReasoningPath';
import { AgentQuestionBank } from './AgentQuestionBank';
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
    graphPaths,
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
  const selectExecution = useObservabilityStore((state) => state.selectExecution);
  const router = useRouter();
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const openTimeline = (targetExecutionId: string) => {
    void selectExecution(targetExecutionId);
    router.push(buildConsoleHref('system-executions', { space: selectedSpaceId }));
  };

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

      <AgentQuestionBank disabled={running} onSelect={setQuestion} />

      <div className="agent-debug-grid">
        <div className="agent-debug-column">
          <AgentExecutionSummary
            executionId={executionId}
            finalResponse={finalResponse}
            graphCount={graphCount}
            plannerDecision={plannerDecision}
            retrievalCount={retrievalCount}
            running={running}
            onOpenTimeline={openTimeline}
          />
          <AgentEventTimeline events={events} />
        </div>
        <div className="agent-debug-column agent-debug-column--wide">
          <AgentTokenStream answer={answer} running={running} />
          <AgentTraceTimeline trace={trace} />
          <AgentGraphReasoningPath
            finalResponse={finalResponse}
            graphCount={graphCount}
            paths={graphPaths}
            plannerDecision={plannerDecision}
            running={running}
          />
        </div>
        <div className="agent-debug-column">
          <AgentCitationInspector
            citations={citations}
            verificationResult={finalResponse?.metadata.verificationResult}
            verified={finalResponse?.metadata.verified}
          />
        </div>
      </div>
    </div>
  );
}
