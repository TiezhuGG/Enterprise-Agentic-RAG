'use client';

import { AnswerTrustPanel } from '@/components/answer-trust';
import type { AgentCitation, AgentVerificationResult } from '@/types/agent';

interface CitationPanelProps {
  citations: AgentCitation[];
  verificationResult?: AgentVerificationResult | null;
  verified?: boolean | null;
}

export function CitationPanel({ citations, verificationResult, verified }: CitationPanelProps) {
  return (
    <aside className="agent-panel" aria-label="Citations">
      <AnswerTrustPanel
        citations={citations}
        title="Citations"
        verificationResult={verificationResult}
        verified={verified ?? undefined}
      />
    </aside>
  );
}
