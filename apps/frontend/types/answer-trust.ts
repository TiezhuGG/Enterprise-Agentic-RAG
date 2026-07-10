import type { AgentCitation, AgentVerificationResult } from './agent';
import type { DocumentFileBlob } from '@/services/document.service';
import type { KnowledgeDocument } from './workbench';

export type AnswerTrustLevel = 'high' | 'medium' | 'low' | 'none';

export interface AnswerTrustSummary {
  description: string;
  label: string;
  level: AnswerTrustLevel;
  maxScore: number | null;
  sourceCount: number;
}

export interface AnswerTrustInput {
  citations: AgentCitation[];
  verificationResult?: AgentVerificationResult | null;
  verified?: boolean;
}

export interface CitationPreviewMatch {
  after: string;
  before: string;
  found: boolean;
  match: string;
}

export interface CitationPreviewState {
  citation: AgentCitation | null;
  document: KnowledgeDocument | null;
  error: string | null;
  file: DocumentFileBlob | null;
  loading: boolean;
  match: CitationPreviewMatch | null;
  open: boolean;
  textPreview: string | null;
}
