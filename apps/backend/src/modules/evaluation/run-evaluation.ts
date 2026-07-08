import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { EvaluationService, type EvaluationDataset } from './index';

const defaultDatasetPath = '../../docs/evaluation/dataset.example.json';
const defaultReportDirectory = '../../docs/evaluation/reports';

async function main() {
  const [, , datasetArg, outputArg] = globalThis.process.argv;
  const datasetPath = resolve(globalThis.process.cwd(), datasetArg ?? defaultDatasetPath);
  const reportDirectory = resolve(globalThis.process.cwd(), outputArg ?? defaultReportDirectory);
  const dataset = JSON.parse(await readFile(datasetPath, 'utf8')) as EvaluationDataset;
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const evaluationService = app.get(EvaluationService);
    const report = await evaluationService.evaluateDataset(dataset);
    const markdownReport = evaluationService.createMarkdownReport(report);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportBaseName = `${dataset.name}-${timestamp}`;
    const jsonPath = resolve(reportDirectory, `${reportBaseName}.json`);
    const markdownPath = resolve(reportDirectory, `${reportBaseName}.md`);

    await mkdir(reportDirectory, { recursive: true });
    await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    await writeFile(markdownPath, markdownReport, 'utf8');

    console.log(
      JSON.stringify(
        {
          jsonPath,
          markdownPath,
          summary: report.summary,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

void main();
