import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import type {
  AgentNodeObservation,
  AgentWorkflowObservation,
  CounterSnapshot,
  DocumentProcessingObservation,
  DurationSnapshot,
  HealthResponse,
  HttpRequestObservation,
  IngestionObservation,
  IngestionStageObservation,
  LlmObservation,
  MetricLabels,
  ObservabilityLogInput,
  RetrievalObservation,
  UploadObservation,
} from './observability.types';

const sensitiveKeyPattern =
  /authorization|api[-_]?key|secret|password|prompt|answer|content|buffer|messages/i;
const sensitiveExactKeys = new Set(['token', 'access_token', 'refresh_token']);
const maxStringLength = 240;
const requiredCounterNames = [
  'http_requests_total',
  'agent_workflows_total',
  'retrieval_requests_total',
  'retrieval_results_total',
  'graph_retrieval_requests_total',
  'graph_retrieval_results_total',
  'llm_requests_total',
  'llm_stream_tokens_total',
  'upload_requests_total',
  'document_processing_total',
  'ingestion_requests_total',
  'ingestion_stage_total',
  'errors_total',
];

@Injectable()
export class ObservabilityService {
  private readonly startedAt = Date.now();
  private readonly counters = new Map<string, CounterSnapshot>();
  private readonly durations = new Map<string, DurationSnapshot>();

  constructor() {
    for (const counterName of requiredCounterNames) {
      this.incrementCounter(counterName, {}, 0);
    }
  }

  createRequestId(): string {
    return randomUUID();
  }

  createExecutionId(): string {
    return randomUUID();
  }

  resolveRequestId(headerValue: unknown): string {
    if (Array.isArray(headerValue)) {
      return this.resolveRequestId(headerValue[0]);
    }

    if (typeof headerValue === 'string' && headerValue.trim()) {
      return headerValue.trim().slice(0, 120);
    }

    return this.createRequestId();
  }

  ensureRequestId(context: ExecutionContext): string {
    const existingRequestId = this.getStringMetadata(context, 'requestId');
    const requestId = existingRequestId || this.createRequestId();

    context.metadata = {
      ...context.metadata,
      requestId,
    };

    return requestId;
  }

  ensureExecutionId(context: ExecutionContext, executionId = this.createExecutionId()): string {
    context.metadata = {
      ...context.metadata,
      executionId,
    };

    return executionId;
  }

  getRequestId(context: Pick<ExecutionContext, 'metadata'>): string | undefined {
    return this.getStringMetadata(context, 'requestId');
  }

  getExecutionId(context: Pick<ExecutionContext, 'metadata'>): string | undefined {
    return this.getStringMetadata(context, 'executionId');
  }

  getHealth(): HealthResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
    };
  }

  getMetricsText(): string {
    const lines: string[] = [];

    for (const counterName of requiredCounterNames) {
      lines.push(`# TYPE ${counterName} counter`);
      for (const counter of this.findCounters(counterName)) {
        lines.push(`${counter.name}${this.formatLabels(counter.labels)} ${counter.value}`);
      }
    }

    const durationNames = [
      ...new Set([...this.durations.values()].map((duration) => duration.name)),
    ];

    for (const durationName of durationNames) {
      lines.push(`# TYPE ${durationName} summary`);
      for (const duration of this.findDurations(durationName)) {
        const labels = this.formatLabels(duration.labels);

        lines.push(`${duration.name}_count${labels} ${duration.count}`);
        lines.push(`${duration.name}_sum${labels} ${duration.sum}`);
        lines.push(`${duration.name}_max${labels} ${duration.max}`);
      }
    }

    return `${lines.join('\n')}\n`;
  }

  recordHttpRequest(input: HttpRequestObservation): void {
    const status = input.statusCode >= 500 ? 'failed' : 'success';

    this.incrementCounter('http_requests_total', {
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
    });
    this.observeDuration('http_request_duration_ms', input.durationMs, {
      method: input.method,
      path: input.path,
    });

    if (input.error || input.statusCode >= 500) {
      this.recordError('http.request', input.error ?? `HTTP ${input.statusCode}`, {
        requestId: input.requestId,
        userId: input.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'http.request',
      level: input.error ? 'error' : 'info',
      metadata: {
        method: input.method,
        path: input.path,
        statusCode: input.statusCode,
      },
      requestId: input.requestId,
      status,
      userId: input.userId,
    });
  }

  recordAgentWorkflow(input: AgentWorkflowObservation): void {
    this.incrementCounter('agent_workflows_total', {
      status: input.status,
      usedGraph: input.usedGraph ?? false,
      usedRetrieval: input.usedRetrieval ?? true,
    });
    this.observeDuration('agent_workflow_duration_ms', input.durationMs, {
      status: input.status,
    });

    if (input.status === 'failed') {
      this.recordError('agent.workflow', input.error, {
        executionId: input.executionId,
        requestId: input.requestId,
        userId: input.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'agent.workflow',
      executionId: input.executionId,
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        usedGraph: input.usedGraph,
        usedRetrieval: input.usedRetrieval,
      },
      requestId: input.requestId,
      status: input.status,
      userId: input.userId,
    });
  }

  recordAgentNode(input: AgentNodeObservation): void {
    this.observeDuration('agent_node_duration_ms', input.durationMs, {
      node: input.node,
      status: input.status,
    });
    this.log({
      durationMs: input.durationMs,
      event: 'agent.node',
      executionId: input.executionId,
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        node: input.node,
      },
      requestId: input.requestId,
      status: input.status,
    });
  }

  recordRetrieval(input: RetrievalObservation): void {
    const requestCounter =
      input.source === 'graph' ? 'graph_retrieval_requests_total' : 'retrieval_requests_total';
    const resultCounter =
      input.source === 'graph' ? 'graph_retrieval_results_total' : 'retrieval_results_total';

    this.incrementCounter(requestCounter, {
      status: input.status,
    });
    this.incrementCounter(
      resultCounter,
      {
        status: input.status,
      },
      input.resultCount,
    );
    this.observeDuration(`${input.source}_retrieval_duration_ms`, input.durationMs, {
      status: input.status,
    });

    if (input.status === 'failed') {
      this.recordError(`${input.source}.retrieval`, input.error, {
        executionId: this.getExecutionId(input.context),
        requestId: this.getRequestId(input.context),
        userId: input.context.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: `${input.source}.retrieval`,
      executionId: this.getExecutionId(input.context),
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        resultCount: input.resultCount,
      },
      requestId: this.getRequestId(input.context),
      status: input.status,
      userId: input.context.userId,
    });
  }

  recordLlmRequest(input: LlmObservation): void {
    this.incrementCounter('llm_requests_total', {
      mode: input.mode,
      operation: input.operation,
      status: input.status,
    });
    this.observeDuration('llm_request_duration_ms', input.durationMs, {
      mode: input.mode,
      operation: input.operation,
      status: input.status,
    });

    if (input.tokenCount) {
      this.incrementCounter(
        'llm_stream_tokens_total',
        {
          operation: input.operation,
        },
        input.tokenCount,
      );
    }

    if (input.status === 'failed') {
      this.recordError('llm.request', input.error, {
        executionId: this.getExecutionId(input.context),
        requestId: this.getRequestId(input.context),
        userId: input.context.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'llm.request',
      executionId: this.getExecutionId(input.context),
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        mode: input.mode,
        operation: input.operation,
        tokenCount: input.tokenCount ?? 0,
      },
      requestId: this.getRequestId(input.context),
      status: input.status,
      userId: input.context.userId,
    });
  }

  recordUpload(input: UploadObservation): void {
    this.incrementCounter('upload_requests_total', {
      status: input.status,
    });
    this.observeDuration('upload_duration_ms', input.durationMs, {
      status: input.status,
    });

    if (input.status === 'failed') {
      this.recordError('upload.document', input.error, {
        executionId: this.getExecutionId(input.context),
        requestId: this.getRequestId(input.context),
        userId: input.context.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'upload.document',
      executionId: this.getExecutionId(input.context),
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        mimeType: input.mimeType,
        size: input.size,
        spaceId: input.spaceId,
      },
      requestId: this.getRequestId(input.context),
      status: input.status,
      userId: input.context.userId,
    });
  }

  recordDocumentProcessing(input: DocumentProcessingObservation): void {
    this.incrementCounter('document_processing_total', {
      status: input.status,
    });
    this.observeDuration('document_processing_duration_ms', input.durationMs, {
      status: input.status,
    });

    if (input.status === 'failed') {
      this.recordError('document.processing', input.error, {});
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'document.processing',
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        documentId: input.documentId,
      },
      status: input.status,
    });
  }

  recordIngestion(input: IngestionObservation): void {
    this.incrementCounter('ingestion_requests_total', {
      status: input.status,
    });
    this.observeDuration('ingestion_duration_ms', input.durationMs, {
      status: input.status,
    });

    if (input.status === 'failed') {
      this.recordError('ingestion.document', input.error, {
        executionId: this.getExecutionId(input.context),
        requestId: this.getRequestId(input.context),
        userId: input.context.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'ingestion.document',
      executionId: this.getExecutionId(input.context),
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        documentId: input.documentId,
        spaceId: input.spaceId,
        stageCount: input.stageCount,
      },
      requestId: this.getRequestId(input.context),
      status: input.status,
      userId: input.context.userId,
    });
  }

  recordIngestionStage(input: IngestionStageObservation): void {
    this.incrementCounter('ingestion_stage_total', {
      stage: input.stage,
      status: input.status,
    });
    this.observeDuration('ingestion_stage_duration_ms', input.durationMs, {
      stage: input.stage,
      status: input.status,
    });

    if (input.status === 'failed') {
      this.recordError('ingestion.stage', input.error, {
        executionId: this.getExecutionId(input.context),
        requestId: this.getRequestId(input.context),
        userId: input.context.userId,
      });
    }

    this.log({
      durationMs: input.durationMs,
      error: input.error,
      event: 'ingestion.stage',
      executionId: this.getExecutionId(input.context),
      level: input.status === 'failed' ? 'error' : 'info',
      metadata: {
        documentId: input.documentId,
        spaceId: input.spaceId,
        stage: input.stage,
      },
      requestId: this.getRequestId(input.context),
      status: input.status,
      userId: input.context.userId,
    });
  }

  recordError(
    source: string,
    error: unknown,
    context: { requestId?: string; executionId?: string; userId?: string },
  ): void {
    this.incrementCounter('errors_total', {
      source,
    });
    this.log({
      error,
      event: 'error',
      executionId: context.executionId,
      level: 'error',
      metadata: {
        source,
      },
      requestId: context.requestId,
      status: 'failed',
      userId: context.userId,
    });
  }

  private incrementCounter(name: string, labels: MetricLabels = {}, value = 1): void {
    const normalizedLabels = this.normalizeLabels(labels);
    const key = this.createMetricKey(name, normalizedLabels);
    const existingCounter = this.counters.get(key);

    if (existingCounter) {
      existingCounter.value += value;
      return;
    }

    this.counters.set(key, {
      labels: normalizedLabels,
      name,
      value,
    });
  }

  private observeDuration(name: string, durationMs: number, labels: MetricLabels = {}): void {
    const normalizedLabels = this.normalizeLabels(labels);
    const key = this.createMetricKey(name, normalizedLabels);
    const existingDuration = this.durations.get(key);

    if (existingDuration) {
      existingDuration.count += 1;
      existingDuration.sum += durationMs;
      existingDuration.max = Math.max(existingDuration.max, durationMs);
      return;
    }

    this.durations.set(key, {
      count: 1,
      labels: normalizedLabels,
      max: durationMs,
      name,
      sum: durationMs,
    });
  }

  private log(input: ObservabilityLogInput): void {
    const payload = {
      durationMs: input.durationMs,
      error: this.serializeError(input.error),
      event: input.event,
      executionId: input.executionId,
      level: input.level,
      metadata: this.sanitize(input.metadata ?? {}),
      requestId: input.requestId,
      status: input.status,
      timestamp: new Date().toISOString(),
      userId: input.userId,
    };
    const serializedPayload = JSON.stringify(payload);

    if (input.level === 'error') {
      console.error(serializedPayload);
      return;
    }

    if (input.level === 'warn') {
      console.warn(serializedPayload);
      return;
    }

    console.log(serializedPayload);
  }

  private getStringMetadata(
    context: Pick<ExecutionContext, 'metadata'>,
    key: 'requestId' | 'executionId',
  ): string | undefined {
    const value = context.metadata[key];

    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private findCounters(name: string): CounterSnapshot[] {
    return [...this.counters.values()].filter((counter) => counter.name === name);
  }

  private findDurations(name: string): DurationSnapshot[] {
    return [...this.durations.values()].filter((duration) => duration.name === name);
  }

  private createMetricKey(name: string, labels: Record<string, string>): string {
    return `${name}:${Object.entries(labels)
      .map(([key, value]) => `${key}=${value}`)
      .join(',')}`;
  }

  private normalizeLabels(labels: MetricLabels): Record<string, string> {
    return Object.fromEntries(
      Object.entries(labels)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)]),
    );
  }

  private formatLabels(labels: Record<string, string>): string {
    const entries = Object.entries(labels);

    if (entries.length === 0) {
      return '';
    }

    return `{${entries
      .map(([key, value]) => `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
      .join(',')}}`;
  }

  private serializeError(error: unknown): Record<string, string> | undefined {
    if (!error) {
      return undefined;
    }

    if (error instanceof Error) {
      return {
        message: this.truncateString(error.message),
        name: error.name,
      };
    }

    return {
      message: this.truncateString(String(error)),
      name: 'Error',
    };
  }

  private sanitize(value: unknown, key = ''): unknown {
    if (sensitiveExactKeys.has(key.toLowerCase()) || sensitiveKeyPattern.test(key)) {
      return '[redacted]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.truncateString(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 10).map((item) => this.sanitize(item, key));
    }

    if (typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([entryKey, entryValue]) => [
          entryKey,
          this.sanitize(entryValue, entryKey),
        ]),
      );
    }

    return String(value);
  }

  private truncateString(value: string): string {
    if (value.length <= maxStringLength) {
      return value;
    }

    return `${value.slice(0, maxStringLength)}...`;
  }
}
