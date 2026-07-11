'use client';

import { useEffect } from 'react';
import { AgentDebugWorkbench } from '@/components/agent-debug';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { DemoGuidePanel, SystemReadinessPanel } from '@/components/demo';
import { ObservabilityWorkbench } from '@/components/observability';
import { SearchCenter } from '@/components/search';
import { useDemoStore } from '@/store/demo.store';
import { useObservabilityStore } from '@/store/observability.store';
import { useWorkbenchStore } from '@/store/workbench.store';
import { AuthPanel } from './AuthPanel';
import { DocumentAccessScopePanel } from './DocumentAccessScopePanel';
import { DocumentListPanel } from './DocumentListPanel';
import { DocumentMetadataPanel } from './DocumentMetadataPanel';
import { DocumentUploadPanel } from './DocumentUploadPanel';
import { IngestionPanel } from './IngestionPanel';
import { PipelineTimeline } from './PipelineTimeline';
import { SpaceMembersPanel } from './SpaceMembersPanel';
import { SpaceSwitcher } from './SpaceSwitcher';

export function DemoWorkbench() {
  const activeTab = useWorkbenchStore((state) => state.activeTab);
  const error = useWorkbenchStore((state) => state.error);
  const initializeDemo = useDemoStore((state) => state.initialize);
  const initialize = useWorkbenchStore((state) => state.initialize);
  const initializeObservability = useObservabilityStore((state) => state.initialize);
  const loading = useWorkbenchStore((state) => state.loading);
  const setActiveTab = useWorkbenchStore((state) => state.setActiveTab);

  useEffect(() => {
    void initialize();
    void initializeDemo();
    void initializeObservability();
  }, [initialize, initializeDemo, initializeObservability]);

  return (
    <main className="workbench-shell">
      <aside className="workbench-sidebar">
        <div className="workbench-brand">
          <span>Enterprise Agentic RAG</span>
          <h1>Demo Workbench</h1>
        </div>

        <div className="workbench-tabs workbench-tabs--five" role="tablist">
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
            aria-selected={activeTab === 'search'}
            className={`workbench-tab ${activeTab === 'search' ? 'workbench-tab--active' : ''}`}
            onClick={() => setActiveTab('search')}
            role="tab"
            type="button"
          >
            Search
          </button>
          <button
            aria-selected={activeTab === 'observability'}
            className={`workbench-tab ${
              activeTab === 'observability' ? 'workbench-tab--active' : ''
            }`}
            onClick={() => setActiveTab('observability')}
            role="tab"
            type="button"
          >
            Observability
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

        <AuthPanel />
        <SystemReadinessPanel />
        <SpaceSwitcher />
        <SpaceMembersPanel />
      </aside>

      <section className="workbench-main">
        {error ? <div className="workbench-error">{error}</div> : null}
        <DemoGuidePanel />

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
              <DocumentAccessScopePanel />
              <DocumentMetadataPanel />
            </div>
          </div>
        ) : null}

        {activeTab === 'observability' ? <ObservabilityWorkbench /> : null}

        {activeTab === 'search' ? <SearchCenter title="Search Center" /> : null}

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
