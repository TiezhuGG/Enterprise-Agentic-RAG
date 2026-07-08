'use client';

import { useEffect } from 'react';
import { AgentDebugWorkbench } from '@/components/agent-debug';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useWorkbenchStore } from '@/store/workbench.store';
import { AuthTokenPanel } from './AuthTokenPanel';
import { DocumentListPanel } from './DocumentListPanel';
import { DocumentMetadataPanel } from './DocumentMetadataPanel';
import { DocumentUploadPanel } from './DocumentUploadPanel';
import { IngestionPanel } from './IngestionPanel';
import { PipelineTimeline } from './PipelineTimeline';
import { SpaceSwitcher } from './SpaceSwitcher';

export function DemoWorkbench() {
  const activeTab = useWorkbenchStore((state) => state.activeTab);
  const error = useWorkbenchStore((state) => state.error);
  const initialize = useWorkbenchStore((state) => state.initialize);
  const loading = useWorkbenchStore((state) => state.loading);
  const setActiveTab = useWorkbenchStore((state) => state.setActiveTab);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <main className="workbench-shell">
      <aside className="workbench-sidebar">
        <div className="workbench-brand">
          <span>Enterprise Agentic RAG</span>
          <h1>Demo Workbench</h1>
        </div>

        <div className="workbench-tabs workbench-tabs--three" role="tablist">
          <button
            aria-selected={activeTab === 'pipeline'}
            className={`workbench-tab ${activeTab === 'pipeline' ? 'workbench-tab--active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
            role="tab"
            type="button"
          >
            Pipeline
          </button>
          <button
            aria-selected={activeTab === 'agent-debug'}
            className={`workbench-tab ${
              activeTab === 'agent-debug' ? 'workbench-tab--active' : ''
            }`}
            onClick={() => setActiveTab('agent-debug')}
            role="tab"
            type="button"
          >
            Agent Debug
          </button>
          <button
            aria-selected={activeTab === 'assistant'}
            className={`workbench-tab ${activeTab === 'assistant' ? 'workbench-tab--active' : ''}`}
            onClick={() => setActiveTab('assistant')}
            role="tab"
            type="button"
          >
            Assistant
          </button>
        </div>

        <AuthTokenPanel />
        <SpaceSwitcher />
      </aside>

      <section className="workbench-main">
        {error ? <div className="workbench-error">{error}</div> : null}

        {activeTab === 'pipeline' ? (
          <div className="workbench-grid" aria-busy={loading}>
            <div className="workbench-column">
              <DocumentUploadPanel />
              <DocumentListPanel />
            </div>
            <div className="workbench-column workbench-column--wide">
              <IngestionPanel />
              <PipelineTimeline />
            </div>
            <div className="workbench-column">
              <DocumentMetadataPanel />
            </div>
          </div>
        ) : null}

        {activeTab === 'agent-debug' ? <AgentDebugWorkbench /> : null}

        {activeTab === 'assistant' ? (
          <div className="workbench-assistant">
            <ChatWindow />
          </div>
        ) : null}
      </section>
    </main>
  );
}
