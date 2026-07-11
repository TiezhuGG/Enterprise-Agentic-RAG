'use client';

import { ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import {
  calculateAnswerTrust,
  getCitationDocumentType,
  getCitationSectionTitle,
  getCitationSourceLabel,
  getGraphCitationPath,
  isGraphCitation,
  toCitationExcerpt,
} from '@/lib/answer-trust';
import { useAnswerTrustStore } from '@/store/answer-trust.store';
import type { AgentCitation, AgentVerificationResult } from '@/types/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CitationPreviewDialog } from './CitationPreviewDialog';

interface AnswerTrustPanelProps {
  citations: AgentCitation[];
  title?: string;
  verificationResult?: AgentVerificationResult | null;
  verified?: boolean;
}

const levelVariant = {
  high: 'success',
  low: 'warning',
  medium: 'info',
  none: 'secondary',
} as const;

export function AnswerTrustPanel({
  citations,
  title = 'Answer Trust',
  verificationResult,
  verified,
}: AnswerTrustPanelProps) {
  const openCitation = useAnswerTrustStore((state) => state.openCitation);
  const summary = calculateAnswerTrust({
    citations,
    verificationResult,
    verified,
  });

  return (
    <section className="answer-trust-panel">
      <div className="answer-trust-panel__header">
        <div>
          <h2>{title}</h2>
          <span>
            {citations.length} citations / {summary.sourceCount} sources
          </span>
        </div>
        <Badge variant={levelVariant[summary.level]}>{summary.label}</Badge>
      </div>

      <div className={`answer-trust-summary answer-trust-summary--${summary.level}`}>
        <ShieldCheck />
        <div>
          <strong>{summary.label}</strong>
          <p>{summary.description}</p>
          {summary.maxScore !== null ? <span>最高相关度 {summary.maxScore.toFixed(4)}</span> : null}
        </div>
      </div>

      {citations.length === 0 ? (
        <div className="answer-trust-empty">
          <FileText />
          <strong>没有找到依据</strong>
          <span>当前回答没有可展示来源。请先确认文档已完成入库，或换一个更具体的问题。</span>
        </div>
      ) : (
        <div className="answer-citation-list">
          {citations.map((citation, index) => {
            const graphPath = getGraphCitationPath(citation);
            const isGraph = isGraphCitation(citation);
            const sourceLabel = getCitationSourceLabel(citation);

            return (
              <article
                className="answer-citation-card"
                key={`${citation.documentId}-${citation.chunkId}-${index}`}
              >
                <header>
                  <div>
                    <strong>{getCitationSectionTitle(citation)}</strong>
                    <span>
                      {getCitationDocumentType(citation)} / 相关度 {citation.score.toFixed(4)}
                    </span>
                  </div>
                  <Badge variant={isGraph ? 'info' : 'secondary'}>{sourceLabel}</Badge>
                </header>
                {graphPath ? (
                  <div className="answer-citation-graph-path">
                    <strong>{graphPath.source.name}</strong>
                    <span>{graphPath.relation}</span>
                    <strong>{graphPath.target.name}</strong>
                  </div>
                ) : null}
                <p>{toCitationExcerpt(citation.content)}</p>
                <footer>
                  <span>{citation.documentId}</span>
                  <Button
                    onClick={() => void openCitation(citation)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <ExternalLink />
                    定位依据
                  </Button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      <CitationPreviewDialog />
    </section>
  );
}
