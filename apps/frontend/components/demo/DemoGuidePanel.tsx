'use client';

import { useAgentDebugStore } from '@/store/agent-debug.store';
import { useDemoStore } from '@/store/demo.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import type { DemoChecklistStep } from '@/types/demo';
import { DemoChecklist } from './DemoChecklist';

const getFirstAction = (steps: DemoChecklistStep[]): string => {
  const nextStep =
    steps.find((step) => step.status === 'blocked') ??
    steps.find((step) => step.status === 'active') ??
    steps.find((step) => step.status === 'pending') ??
    steps[steps.length - 1];

  return nextStep.detail;
};

export function DemoGuidePanel() {
  const finalResponse = useAgentDebugStore((state) => state.finalResponse);
  const activeTab = useWorkbenchStore((state) => state.activeTab);
  const authToken = useWorkbenchStore((state) => state.authToken);
  const documents = useWorkbenchStore((state) => state.documents);
  const ingestionStatus = useWorkbenchStore((state) => state.ingestionStatus);
  const selectedDocumentId = useWorkbenchStore((state) => state.selectedDocumentId);
  const selectedSpaceId = useWorkbenchStore((state) => state.selectedSpaceId);
  const readiness = useDemoStore((state) => state.readiness);

  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? null;
  const isReadyForRetrieval =
    Boolean(ingestionStatus?.readyForRetrieval) || selectedDocument?.status === 'READY';

  const steps: DemoChecklistStep[] = [
    {
      detail:
        readiness === 'ready'
          ? 'Backend health and metrics are reachable.'
          : 'Check backend readiness.',
      id: 'system',
      label: 'System',
      status: readiness === 'ready' ? 'done' : readiness === 'degraded' ? 'blocked' : 'active',
    },
    {
      detail: authToken ? 'JWT token is saved for API calls.' : 'Save a JWT token.',
      id: 'auth',
      label: 'Auth',
      status: authToken ? 'done' : 'blocked',
    },
    {
      detail: selectedSpaceId ? 'Knowledge Space selected.' : 'Create or select a Space.',
      id: 'space',
      label: 'Space',
      status: selectedSpaceId ? 'done' : authToken ? 'active' : 'pending',
    },
    {
      detail:
        documents.length > 0 ? 'Document is available.' : 'Upload the sample policy document.',
      id: 'upload',
      label: 'Upload',
      status: documents.length > 0 ? 'done' : selectedSpaceId ? 'active' : 'pending',
    },
    {
      detail: isReadyForRetrieval
        ? 'Document is ready for retrieval.'
        : 'Run ingestion for the selected document.',
      id: 'ingest',
      label: 'Ingest',
      status: isReadyForRetrieval ? 'done' : selectedDocument ? 'active' : 'pending',
    },
    {
      detail: finalResponse ? 'Agent execution completed.' : 'Run an Agent Debug question.',
      id: 'agent',
      label: 'Agent',
      status: finalResponse ? 'done' : isReadyForRetrieval ? 'active' : 'pending',
    },
    {
      detail:
        activeTab === 'assistant' ? 'Assistant is open.' : 'Use Assistant for the final Q&A view.',
      id: 'assistant',
      label: 'Assistant',
      status: activeTab === 'assistant' ? 'active' : finalResponse ? 'done' : 'pending',
    },
  ];

  return (
    <section className="demo-guide">
      <div className="demo-guide__header">
        <div>
          <span>MVP Demo Flow</span>
          <h2>{'System Ready -> Auth -> Space -> Upload -> Ingest -> Agent Debug -> Assistant'}</h2>
        </div>
        <strong>{getFirstAction(steps)}</strong>
      </div>
      <DemoChecklist steps={steps} />
    </section>
  );
}
