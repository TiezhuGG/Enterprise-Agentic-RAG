'use client';

import { AnswerTrustPanel } from '@/components/answer-trust';
import type { AgentCitation, AgentVerificationResult } from '@/types/agent';

interface AgentCitationInspectorProps {
  citations: AgentCitation[];
  verificationResult?: AgentVerificationResult | null;
  verified?: boolean;
}

export function AgentCitationInspector({
  citations,
  verificationResult,
  verified,
}: AgentCitationInspectorProps) {
  return (
    <section className="workbench-panel agent-debug-citation-panel">
      <AnswerTrustPanel
        citations={citations}
        title="引用来源"
        verificationResult={verificationResult}
        verified={verified}
      />
    </section>
  );
}
