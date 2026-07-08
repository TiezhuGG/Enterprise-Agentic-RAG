import { Injectable } from '@nestjs/common';
import { AgentService } from '../agent';
import type { AgentCitation } from '../agent/graph/agent.state';
import { RetrievalService, type ContextChunk } from '../retrieval';
import type {
  EvaluationCase,
  EvaluationCaseMetrics,
  EvaluationCaseResult,
  EvaluationContext,
  EvaluationContextInput,
  EvaluationDataset,
  EvaluationReport,
  EvaluationSummary,
} from './evaluation.types';

const tokenPattern =
  /(\p{Script=Han}|\p{Script=Hiragana}|\p{Script=Katakana}|\p{Script=Hangul}|[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*)/gu;

@Injectable()
export class EvaluationService {
  constructor(
    private readonly agentService: AgentService,
    private readonly retrievalService: RetrievalService,
  ) {}

  async evaluateDataset(dataset: EvaluationDataset): Promise<EvaluationReport> {
    const caseResults: EvaluationCaseResult[] = [];

    for (const evaluationCase of dataset.cases) {
      caseResults.push(await this.evaluateCase(dataset.defaultContext, evaluationCase));
    }

    return {
      cases: caseResults,
      dataset: {
        description: dataset.description,
        name: dataset.name,
      },
      generatedAt: new Date().toISOString(),
      summary: this.createSummary(dataset.name, caseResults),
    };
  }

  async evaluateCase(
    defaultContext: EvaluationContextInput,
    evaluationCase: EvaluationCase,
  ): Promise<EvaluationCaseResult> {
    try {
      const context = this.createExecutionContext(defaultContext, evaluationCase.context);
      const retrievedChunks = await this.retrievalService.retrieve(context, {
        ...evaluationCase.retrieval,
        query: evaluationCase.query,
      });
      const agentResponse = evaluationCase.conversationId
        ? await this.agentService.execute(context, {
            conversationId: evaluationCase.conversationId,
            question: evaluationCase.query,
            ...evaluationCase.retrieval,
          })
        : null;
      const citations = agentResponse?.citations ?? this.toRetrievalCitations(retrievedChunks);

      return {
        answerAvailable: Boolean(agentResponse),
        citations,
        id: evaluationCase.id,
        metrics: this.calculateMetrics(
          evaluationCase,
          retrievedChunks,
          citations,
          agentResponse?.answer,
        ),
        query: evaluationCase.query,
        retrievedChunkIds: retrievedChunks.map((chunk) => chunk.chunkId),
        retrievedDocumentIds: [...new Set(retrievedChunks.map((chunk) => chunk.documentId))],
        status: 'passed',
      };
    } catch (error) {
      return {
        answerAvailable: false,
        citations: [],
        error: error instanceof Error ? error.message : 'Evaluation case failed',
        id: evaluationCase.id,
        metrics: {
          answerExpectedTermCoverage: null,
          answerGroundedness: null,
          citationCoverage: null,
          retrievalRecall: null,
        },
        query: evaluationCase.query,
        retrievedChunkIds: [],
        retrievedDocumentIds: [],
        status: 'failed',
      };
    }
  }

  createMarkdownReport(report: EvaluationReport): string {
    const lines = [
      `# RAG Evaluation Report: ${report.dataset.name}`,
      '',
      `Generated at: ${report.generatedAt}`,
      '',
      '## Summary',
      '',
      `- Total cases: ${report.summary.totalCases}`,
      `- Passed cases: ${report.summary.passedCases}`,
      `- Failed cases: ${report.summary.failedCases}`,
      `- Average retrieval recall: ${this.formatScore(report.summary.averageRetrievalRecall)}`,
      `- Average citation coverage: ${this.formatScore(report.summary.averageCitationCoverage)}`,
      `- Average answer expected-term coverage: ${this.formatScore(
        report.summary.averageAnswerExpectedTermCoverage,
      )}`,
      `- Average answer groundedness: ${this.formatScore(report.summary.averageAnswerGroundedness)}`,
      '',
      '## Cases',
      '',
    ];

    for (const result of report.cases) {
      lines.push(`### ${result.id}`);
      lines.push('');
      lines.push(`- Status: ${result.status}`);
      lines.push(`- Answer available: ${result.answerAvailable ? 'yes' : 'no'}`);
      lines.push(`- Retrieval recall: ${this.formatScore(result.metrics.retrievalRecall)}`);
      lines.push(`- Citation coverage: ${this.formatScore(result.metrics.citationCoverage)}`);
      lines.push(
        `- Answer expected-term coverage: ${this.formatScore(
          result.metrics.answerExpectedTermCoverage,
        )}`,
      );
      lines.push(`- Answer groundedness: ${this.formatScore(result.metrics.answerGroundedness)}`);
      lines.push(`- Retrieved chunks: ${result.retrievedChunkIds.join(', ') || 'none'}`);
      lines.push(`- Retrieved documents: ${result.retrievedDocumentIds.join(', ') || 'none'}`);

      if (result.error) {
        lines.push(`- Error: ${result.error}`);
      }

      lines.push('');
    }

    return `${lines.join('\n')}\n`;
  }

  private createExecutionContext(
    defaultContext: EvaluationContextInput,
    override: Partial<EvaluationContextInput> | undefined,
  ): EvaluationContext {
    return {
      departmentId: override?.departmentId ?? defaultContext.departmentId,
      metadata: {
        ...defaultContext.metadata,
        ...override?.metadata,
        source: 'evaluation',
      },
      permissions: override?.permissions ?? defaultContext.permissions,
      roles: override?.roles ?? defaultContext.roles,
      spaceIds: override?.spaceIds ?? defaultContext.spaceIds,
      tenantId: override?.tenantId ?? defaultContext.tenantId,
      userId: override?.userId ?? defaultContext.userId,
    };
  }

  private calculateMetrics(
    evaluationCase: EvaluationCase,
    retrievedChunks: ContextChunk[],
    citations: AgentCitation[],
    answer: string | undefined,
  ): EvaluationCaseMetrics {
    const expectedIds = this.getExpectedIds(evaluationCase);
    const retrievedIds = this.getResultIds(
      retrievedChunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
      })),
    );
    const citationIds = this.getResultIds(citations);

    return {
      answerExpectedTermCoverage:
        answer && evaluationCase.expectedAnswer
          ? this.calculateTokenCoverage(
              this.tokenize(evaluationCase.expectedAnswer),
              this.tokenize(answer),
            )
          : null,
      answerGroundedness: answer
        ? this.calculateTokenCoverage(
            this.tokenize(answer),
            this.tokenize(citations.map((citation) => citation.content).join('\n')),
          )
        : null,
      citationCoverage:
        expectedIds.length > 0 ? this.calculateSetCoverage(expectedIds, citationIds) : null,
      retrievalRecall:
        expectedIds.length > 0 ? this.calculateSetCoverage(expectedIds, retrievedIds) : null,
    };
  }

  private getExpectedIds(evaluationCase: EvaluationCase): string[] {
    return [
      ...(evaluationCase.expectedCitationChunkIds ?? []).map((id) => `chunk:${id}`),
      ...(evaluationCase.expectedCitationDocumentIds ?? []).map((id) => `document:${id}`),
    ];
  }

  private getResultIds(results: Array<{ chunkId: string; documentId: string }>): string[] {
    return [
      ...results.map((result) => `chunk:${result.chunkId}`),
      ...results.map((result) => `document:${result.documentId}`),
    ];
  }

  private calculateSetCoverage(expectedIds: string[], actualIds: string[]): number {
    const actualSet = new Set(actualIds);
    const hitCount = expectedIds.filter((expectedId) => actualSet.has(expectedId)).length;

    return this.roundScore(hitCount / expectedIds.length);
  }

  private calculateTokenCoverage(expectedTokens: string[], actualTokens: string[]): number | null {
    if (expectedTokens.length === 0) {
      return null;
    }

    const actualTokenSet = new Set(actualTokens);
    const hitCount = expectedTokens.filter((token) => actualTokenSet.has(token)).length;

    return this.roundScore(hitCount / expectedTokens.length);
  }

  private createSummary(
    datasetName: string,
    caseResults: EvaluationCaseResult[],
  ): EvaluationSummary {
    return {
      averageAnswerExpectedTermCoverage: this.averageMetric(
        caseResults,
        (result) => result.metrics.answerExpectedTermCoverage,
      ),
      averageAnswerGroundedness: this.averageMetric(
        caseResults,
        (result) => result.metrics.answerGroundedness,
      ),
      averageCitationCoverage: this.averageMetric(
        caseResults,
        (result) => result.metrics.citationCoverage,
      ),
      averageRetrievalRecall: this.averageMetric(
        caseResults,
        (result) => result.metrics.retrievalRecall,
      ),
      datasetName,
      failedCases: caseResults.filter((result) => result.status === 'failed').length,
      passedCases: caseResults.filter((result) => result.status === 'passed').length,
      totalCases: caseResults.length,
    };
  }

  private averageMetric(
    caseResults: EvaluationCaseResult[],
    selector: (result: EvaluationCaseResult) => number | null,
  ): number | null {
    const values = caseResults
      .map(selector)
      .filter((value): value is number => typeof value === 'number');

    if (values.length === 0) {
      return null;
    }

    return this.roundScore(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private tokenize(content: string): string[] {
    return [...content.toLowerCase().matchAll(tokenPattern)]
      .map((match) => match[0].trim())
      .filter(Boolean);
  }

  private toRetrievalCitations(chunks: ContextChunk[]): AgentCitation[] {
    return chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      content: chunk.content,
      documentId: chunk.documentId,
      metadata: chunk.metadata,
      score: chunk.score,
    }));
  }

  private roundScore(value: number): number {
    return Number(value.toFixed(4));
  }

  private formatScore(value: number | null): string {
    return value === null ? 'n/a' : value.toFixed(4);
  }
}
