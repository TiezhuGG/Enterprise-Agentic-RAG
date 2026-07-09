import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import { ConversationService } from '../conversation';
import { DocumentService, type DocumentEntity } from '../document';
import { KnowledgeSpaceService, type KnowledgeSpaceEntity } from '../knowledge-space';
import { UploadService } from '../upload';
import { UserRepository, type UserRecord } from '../user';
import { IngestionService } from './ingestion.service';
import type { IngestionResult } from './ingestion.types';

const defaultEmail = 'admin@example.com';
const defaultPassword = 'Admin123!';
const defaultSpaceName = 'MVP Demo Space';
const defaultDocumentTitle = '企业费用报销与知识库使用制度';
const defaultConversationTitle = 'MVP Demo Conversation';
const defaultSamplePath = '../../docs/demo/sample-policy.md';

interface DemoSeedArgs {
  email: string;
  force: boolean;
  includeEmbedding: boolean;
  includeGraph: boolean;
  ingest: boolean;
  samplePath: string;
}

async function main() {
  const args = parseArgs(globalThis.process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const configService = app.get(ConfigService);
    const conversationService = app.get(ConversationService);
    const documentService = app.get(DocumentService);
    const ingestionService = app.get(IngestionService);
    const knowledgeSpaceService = app.get(KnowledgeSpaceService);
    const uploadService = app.get(UploadService);
    const userRepository = app.get(UserRepository);
    const user = await findDemoUser(args.email, userRepository);
    const context = createContext(user);
    const space = await findOrCreateSpace(context, knowledgeSpaceService);

    context.spaceIds = unique([...context.spaceIds, space.id]);

    const document = await findOrUploadDocument(context, space, args.samplePath, {
      documentService,
      uploadService,
    });
    const ingestion = args.ingest
      ? await ingestionService.ingestDocument(context, document.id, {
          force: args.force,
          includeEmbedding: args.includeEmbedding,
          includeGraph: args.includeGraph,
        })
      : null;
    const conversation = await findOrCreateConversation(context, conversationService);
    const backendUrl = `http://localhost:${configService.getAppConfig().port}`;

    console.log(
      JSON.stringify(
        {
          backendUrl,
          conversationId: conversation.id,
          documentId: document.id,
          frontendUrl: 'http://localhost:3001',
          ingestion: ingestion ? summarizeIngestion(ingestion) : null,
          login: {
            email: args.email,
            password: defaultPassword,
          },
          samplePath: resolve(globalThis.process.cwd(), args.samplePath),
          smokeCommand: `pnpm demo:smoke ${user.id} ${conversation.id} "单笔超过10000元的报销需要谁审批？" ${space.id}`,
          spaceId: space.id,
          userId: user.id,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): DemoSeedArgs {
  return {
    email: readOption(argv, '--email') ?? defaultEmail,
    force: !hasFlag(argv, '--no-force'),
    includeEmbedding: !hasFlag(argv, '--no-embedding'),
    includeGraph: hasFlag(argv, '--graph'),
    ingest: !hasFlag(argv, '--no-ingest'),
    samplePath: readOption(argv, '--sample') ?? defaultSamplePath,
  };
}

async function findDemoUser(email: string, userRepository: UserRepository): Promise<UserRecord> {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new Error(`Demo user not found: ${email}. Run pnpm db:seed first.`);
  }

  return user;
}

function createContext(user: UserRecord): ExecutionContext {
  return {
    departmentId: user.departmentId ?? undefined,
    metadata: {
      source: 'demo-seed',
    },
    organizationId: user.organizationId ?? undefined,
    permissions: unique(user.roles.flatMap((role) => role.permissions)),
    roles: user.roles.map((role) => role.code),
    spaceIds: user.spaceIds,
    tenantId: user.tenantId ?? undefined,
    userId: user.id,
  };
}

async function findOrCreateSpace(
  context: ExecutionContext,
  knowledgeSpaceService: KnowledgeSpaceService,
): Promise<KnowledgeSpaceEntity> {
  const existingSpace = (await knowledgeSpaceService.list(context)).find(
    (space) => space.name === defaultSpaceName,
  );

  if (existingSpace) {
    return existingSpace;
  }

  return knowledgeSpaceService.create(context, {
    description: '用于演示企业知识库入库、检索、Agent Trace 与 Citation 的样例空间。',
    name: defaultSpaceName,
    visibility: 'PRIVATE',
  });
}

async function findOrUploadDocument(
  context: ExecutionContext,
  space: KnowledgeSpaceEntity,
  samplePath: string,
  services: {
    documentService: DocumentService;
    uploadService: UploadService;
  },
): Promise<DocumentEntity> {
  const existingDocument = (await services.documentService.listBySpace(context, space.id)).find(
    (document) => document.title === defaultDocumentTitle,
  );

  if (existingDocument?.storageKey) {
    return existingDocument;
  }

  const resolvedSamplePath = resolve(globalThis.process.cwd(), samplePath);
  const buffer = await readFile(resolvedSamplePath);

  return services.uploadService.uploadDocument(
    context,
    space.id,
    {
      description: 'MVP demo policy document.',
      title: defaultDocumentTitle,
    },
    {
      buffer,
      mimetype: 'text/markdown',
      originalname: basename(resolvedSamplePath),
      size: buffer.length,
    },
  );
}

async function findOrCreateConversation(
  context: ExecutionContext,
  conversationService: ConversationService,
) {
  const existingConversation = (await conversationService.list(context)).find(
    (conversation) => conversation.title === defaultConversationTitle,
  );

  if (existingConversation) {
    return existingConversation;
  }

  return conversationService.create(context, {
    title: defaultConversationTitle,
  });
}

function summarizeIngestion(result: IngestionResult) {
  return {
    chunkCount: result.counts.chunks,
    documentStatus: result.status,
    embeddingCount: result.counts.embeddings,
    pipelineJobId: result.pipelineJobId,
    readyForRetrieval: result.readyForRetrieval,
    stages: result.stages.map((stage) => ({
      durationMs: stage.durationMs,
      stage: stage.stage,
      status: stage.status,
    })),
  };
}

function hasFlag(argv: string[], flag: string): boolean {
  return argv.includes(flag);
}

function readOption(argv: string[], name: string): string | undefined {
  const inline = argv.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1).trim() || undefined;
  }

  const index = argv.indexOf(name);

  if (index >= 0) {
    return argv[index + 1]?.trim() || undefined;
  }

  return undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Demo seed failed');
  globalThis.process.exitCode = 1;
});
