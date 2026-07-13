import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { PipelineService } from '../pipeline';
import { TaxonomyService } from '../taxonomy';
import { UploadService, type UploadedDocumentFile } from '../upload';
import { UserRepository, type UserRecord } from '../user';
import type { IngestionJobResponse } from '../ingestion';
import { KnowledgeSpaceService } from '../knowledge-space';
import { BatchService } from './batch.service';
import type { BatchOperationResponse } from './batch.types';

const smokeEmail = globalThis.process.env.BATCH_SMOKE_EMAIL ?? 'admin@example.com';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const batchService = app.get(BatchService);
    const knowledgeSpaceService = app.get(KnowledgeSpaceService);
    const pipelineService = app.get(PipelineService);
    const taxonomyService = app.get(TaxonomyService);
    const uploadService = app.get(UploadService);
    const userRepository = app.get(UserRepository);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    let context = await createContext(userRepository, stamp);

    const space = await knowledgeSpaceService.create(context, {
      description: 'TASK-067 batch operations smoke test space',
      name: `Batch Smoke ${stamp}`,
      visibility: 'PRIVATE',
    });
    context = {
      ...context,
      spaceIds: [...new Set([...context.spaceIds, space.id])],
    };

    const [policyUpload, guidelineUpload] = await Promise.all([
      uploadService.uploadDocument(
        context,
        space.id,
        {
          autoIngest: false,
          description: 'Batch smoke reimbursement policy',
          title: `Batch Smoke Reimbursement ${stamp}`,
        },
        createUploadedFile(
          `batch-smoke-reimbursement-${stamp}.md`,
          'text/markdown',
          [
            '# Batch Smoke Reimbursement Policy',
            '',
            'Employees can submit reimbursement requests after manager approval.',
            '',
            '## Approval',
            '',
            '- Requests above 10000 require finance review.',
            '- Requests above 30000 require director approval.',
          ].join('\n'),
        ),
      ),
      uploadService.uploadDocument(
        context,
        space.id,
        {
          autoIngest: false,
          description: 'Batch smoke knowledge base guideline',
          title: `Batch Smoke Guideline ${stamp}`,
        },
        createUploadedFile(
          `batch-smoke-guideline-${stamp}.txt`,
          'text/plain',
          [
            'Knowledge Base Guideline',
            '',
            'Documents must include source, owner, and review frequency.',
            'Confidential material should not be shared outside the authorized department.',
          ].join('\n'),
        ),
      ),
    ]);

    const policyDocument = policyUpload.document;
    const guidelineDocument = guidelineUpload.document;

    const [category, policyTag, smokeTag] = await Promise.all([
      taxonomyService.createCategory(context, space.id, {
        color: '#2563eb',
        name: `Batch Smoke Category ${stamp}`,
      }),
      taxonomyService.createTag(context, space.id, {
        color: '#0f766e',
        name: `policy-${stamp}`,
      }),
      taxonomyService.createTag(context, space.id, {
        color: '#7c3aed',
        name: `smoke-${stamp}`,
      }),
    ]);

    const documentIds = [policyDocument.id, guidelineDocument.id];
    const taxonomyResult = await batchService.updateTaxonomy(context, {
      categoryId: category.id,
      documentIds: [policyDocument.id, guidelineDocument.id, policyDocument.id],
      tagIds: [policyTag.id, smokeTag.id],
    });
    assertBatchResult('taxonomy', taxonomyResult, 2);

    const ingestResult = await batchService.ingestDocuments(context, {
      documentIds,
      force: true,
      includeEmbedding: false,
      includeGraph: false,
    });
    assertBatchResult('ingest', ingestResult, 2);
    const successfulIngestions = ingestResult.results
      .filter((item): item is typeof item & { data: IngestionJobResponse } => item.status === 'success')
      .map((item) => item.data);

    for (const result of successfulIngestions) {
      if (result.status !== 'QUEUED' || !result.pipelineJobId) {
        throw new Error(`Ingestion did not enqueue a pipeline job for ${result.documentId}`);
      }
    }

    const firstJobId = successfulIngestions[0]?.pipelineJobId;
    const pipelineEvents = firstJobId ? await pipelineService.listJobEvents(context, firstJobId) : [];
    const pipelineStages = pipelineEvents.map((event) => `${event.stage}:${event.status}`);
    assertIncludes(pipelineStages, 'queue:SUCCEEDED');

    const archiveResult = await batchService.archiveDocuments(context, {
      documentIds,
    });
    assertBatchResult('archive', archiveResult, 2);

    console.log(
      JSON.stringify(
        {
          archive: summarizeBatch(archiveResult),
          documents: documentIds,
          ingest: {
            ...summarizeBatch(ingestResult),
            pipelineJobIds: successfulIngestions
              .map((result) => result.pipelineJobId)
              .filter(Boolean),
          },
          pipelineStages,
          spaceId: space.id,
          taxonomy: summarizeBatch(taxonomyResult),
          userEmail: smokeEmail,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

async function createContext(
  userRepository: UserRepository,
  stamp: string,
): Promise<ExecutionContext> {
  const user = await userRepository.findByEmail(smokeEmail);

  if (!user) {
    throw new Error(`Batch smoke user not found: ${smokeEmail}. Run pnpm db:seed first.`);
  }

  return toExecutionContext(user, stamp);
}

function toExecutionContext(user: UserRecord, stamp: string): ExecutionContext {
  return {
    departmentId: user.departmentId ?? undefined,
    metadata: {
      executionId: `batch-smoke-${stamp}`,
      requestId: `batch-smoke-${stamp}`,
      source: 'batch-smoke',
    },
    organizationId: user.organizationId ?? undefined,
    permissions: unique(user.roles.flatMap((role) => role.permissions)),
    roles: user.roles.map((role) => role.code),
    spaceIds: user.spaceIds,
    tenantId: user.tenantId ?? undefined,
    userId: user.id,
  };
}

function createUploadedFile(
  originalname: string,
  mimetype: string,
  content: string,
): UploadedDocumentFile {
  const buffer = Buffer.from(content, 'utf8');

  return {
    buffer,
    mimetype,
    originalname,
    size: buffer.length,
  };
}

function assertBatchResult<TData>(
  operation: string,
  result: BatchOperationResponse<TData>,
  expectedTotal: number,
): void {
  if (result.total !== expectedTotal || result.succeeded !== expectedTotal || result.failed !== 0) {
    throw new Error(
      `${operation} batch failed: ${JSON.stringify(
        {
          failed: result.failed,
          failures: result.results
            .filter((item) => item.status === 'failed')
            .map((item) => ({
              documentId: item.documentId,
              errorMessage: item.errorMessage,
            })),
          succeeded: result.succeeded,
          total: result.total,
        },
        null,
        2,
      )}`,
    );
  }
}

function assertIncludes(values: string[], expected: string): void {
  if (!values.includes(expected)) {
    throw new Error(`Expected pipeline stage ${expected}, received ${values.join(', ')}`);
  }
}

function summarizeBatch<TData>(result: BatchOperationResponse<TData>) {
  return {
    failed: result.failed,
    operation: result.operation,
    succeeded: result.succeeded,
    total: result.total,
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Batch smoke failed');
  globalThis.process.exitCode = 1;
});
