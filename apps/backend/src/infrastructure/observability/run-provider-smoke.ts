import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ConfigService } from '../../config';
import { ReadinessService } from './readiness.service';
import type { ReadinessResponse } from './observability.types';

interface ProviderSmokeReport {
  generatedAt: string;
  app: {
    env: string;
    port: number;
  };
  providers: Array<{
    configured: boolean;
    endpoint: string;
    model: string;
    mode?: string;
    name: string;
  }>;
  readiness: ReadinessResponse;
}

const defaultReportDirectory = '../../docs/demo/reports';

async function main() {
  const [, , outputArg] = globalThis.process.argv;
  const reportDirectory = resolve(globalThis.process.cwd(), outputArg ?? defaultReportDirectory);
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const configService = app.get(ConfigService);
    const readinessService = app.get(ReadinessService);
    const report = await createReport(configService, await readinessService.getReadiness());
    const timestamp = report.generatedAt.replace(/[:.]/g, '-');
    const jsonPath = resolve(reportDirectory, `provider-smoke-${timestamp}.json`);
    const markdownPath = resolve(reportDirectory, `provider-smoke-${timestamp}.md`);

    await mkdir(reportDirectory, { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await writeFile(markdownPath, createMarkdownReport(report), 'utf8');

    console.log(
      JSON.stringify(
        {
          jsonPath,
          markdownPath,
          status: report.readiness.status,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

async function createReport(
  configService: ConfigService,
  readiness: ReadinessResponse,
): Promise<ProviderSmokeReport> {
  const appConfig = configService.getAppConfig();
  const llmConfig = configService.getLlmConfig();
  const embeddingConfig = configService.getEmbeddingConfig();
  const rerankerConfig = configService.getRerankerConfig();
  const ocrConfig = configService.getOcrConfig();
  const asrConfig = configService.getAsrConfig();
  const videoConfig = configService.getVideoUnderstandingConfig();

  return {
    app: {
      env: appConfig.env,
      port: appConfig.port,
    },
    generatedAt: new Date().toISOString(),
    providers: [
      {
        configured: Boolean(llmConfig.apiUrl && llmConfig.model),
        endpoint: safeEndpoint(llmConfig.apiUrl),
        model: llmConfig.model,
        name: 'llm',
      },
      {
        configured: Boolean(embeddingConfig.apiUrl && embeddingConfig.model),
        endpoint: safeEndpoint(embeddingConfig.apiUrl),
        model: embeddingConfig.model,
        name: 'embedding',
      },
      {
        configured: Boolean(rerankerConfig.apiUrl && rerankerConfig.model),
        endpoint: safeEndpoint(rerankerConfig.apiUrl),
        model: rerankerConfig.model,
        name: 'reranker',
      },
      {
        configured:
          ocrConfig.provider === 'metadata' || Boolean(ocrConfig.apiUrl && ocrConfig.model),
        endpoint: safeEndpoint(ocrConfig.apiUrl),
        mode: ocrConfig.provider,
        model: ocrConfig.model,
        name: 'ocr',
      },
      {
        configured:
          asrConfig.provider === 'metadata' || Boolean(asrConfig.apiUrl && asrConfig.model),
        endpoint: safeEndpoint(asrConfig.apiUrl),
        mode: asrConfig.provider,
        model: asrConfig.model,
        name: 'asr',
      },
      {
        configured:
          videoConfig.provider === 'metadata' || Boolean(videoConfig.apiUrl && videoConfig.model),
        endpoint: safeEndpoint(videoConfig.apiUrl),
        mode: videoConfig.provider,
        model: videoConfig.model,
        name: 'video',
      },
    ],
    readiness,
  };
}

function createMarkdownReport(report: ProviderSmokeReport): string {
  const providerRows = report.providers
    .map(
      (provider) =>
        `| ${provider.name} | ${provider.configured ? 'yes' : 'no'} | ${
          provider.mode ?? '-'
        } | ${provider.model || '-'} | ${provider.endpoint || '-'} |`,
    )
    .join('\n');
  const readinessRows = report.readiness.checks
    .map(
      (check) =>
        `| ${check.name} | ${check.status} | ${check.durationMs ?? '-'} | ${check.message ?? ''} |`,
    )
    .join('\n');

  return [
    '# Provider Smoke Report',
    '',
    `Generated at: ${report.generatedAt}`,
    `Status: ${report.readiness.status}`,
    '',
    '## Providers',
    '',
    '| Name | Configured | Mode | Model | Endpoint |',
    '| --- | --- | --- | --- | --- |',
    providerRows,
    '',
    '## Readiness',
    '',
    '| Check | Status | Duration(ms) | Message |',
    '| --- | --- | --- | --- |',
    readinessRows,
    '',
    'Sensitive values such as API keys, prompts, answers, and document content are intentionally omitted.',
    '',
  ].join('\n');
}

function safeEndpoint(value: string): string {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);

    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return 'configured';
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Provider smoke failed');
  globalThis.process.exitCode = 1;
});
