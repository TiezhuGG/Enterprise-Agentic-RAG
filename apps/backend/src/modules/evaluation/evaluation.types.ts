import type { ExecutionContext } from '../../common';
import type { AgentCitation } from '../agent/graph/agent.state';
import type { RetrievalRequest } from '../retrieval';

export interface EvaluationContextInput {
  userId: string;
  roles: string[];
  permissions: string[];
  spaceIds: string[];
  tenantId?: string;
  departmentId?: string;
  metadata?: Record<string, unknown>;
}

export interface EvaluationCase {
  id: string;
  query: string;
  expectedAnswer?: string;
  expectedCitationChunkIds?: string[];
  expectedCitationDocumentIds?: string[];
  conversationId?: string;
  context?: Partial<EvaluationContextInput>;
  retrieval?: Omit<RetrievalRequest, 'query'>;
}

export interface EvaluationDataset {
  name: string;
  description?: string;
  defaultContext: EvaluationContextInput;
  cases: EvaluationCase[];
}

export interface EvaluationCaseMetrics {
  retrievalRecall: number | null;
  citationCoverage: number | null;
  answerExpectedTermCoverage: number | null;
  answerGroundedness: number | null;
}

export interface EvaluationCaseResult {
  id: string;
  query: string;
  status: 'passed' | 'failed';
  error?: string;
  retrievedChunkIds: string[];
  retrievedDocumentIds: string[];
  citations: AgentCitation[];
  answerAvailable: boolean;
  metrics: EvaluationCaseMetrics;
}

export interface EvaluationSummary {
  datasetName: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  averageRetrievalRecall: number | null;
  averageCitationCoverage: number | null;
  averageAnswerExpectedTermCoverage: number | null;
  averageAnswerGroundedness: number | null;
}

export interface EvaluationReport {
  dataset: {
    name: string;
    description?: string;
  };
  generatedAt: string;
  summary: EvaluationSummary;
  cases: EvaluationCaseResult[];
}

export interface EvaluationReportFiles {
  jsonPath: string;
  markdownPath: string;
}

export interface EvaluationRunResult {
  report: EvaluationReport;
  files: EvaluationReportFiles;
}

export type EvaluationContext = ExecutionContext;
