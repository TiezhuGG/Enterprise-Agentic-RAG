import { readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { hash } from 'bcryptjs';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { ConfigService } from '../../config';
import { AuthRepository } from '../auth';
import { ConversationService, type ConversationEntity } from '../conversation';
import { DocumentService, type DocumentEntity } from '../document';
import { EnterpriseRepository } from '../enterprise';
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
const defaultDatasetPath = '../../docs/demo/sample-dataset.json';
const passwordSaltRounds = 10;

const demoPermissions = [
  {
    code: 'user.read',
    description: 'View user records and assigned roles.',
    name: 'Read users',
  },
  {
    code: 'user.write',
    description: 'Create and update user records.',
    name: 'Write users',
  },
  {
    code: 'role.manage',
    description: 'Manage roles and permissions.',
    name: 'Manage roles',
  },
  {
    code: 'knowledge.read',
    description: 'Read knowledge spaces, documents, chunks, and retrieval candidates.',
    name: 'Read knowledge',
  },
  {
    code: 'knowledge.retrieve',
    description: 'Run knowledge retrieval over accessible spaces.',
    name: 'Retrieve knowledge',
  },
  {
    code: 'knowledge.confidential.read',
    description: 'Read confidential knowledge resources when policy allows it.',
    name: 'Read confidential knowledge',
  },
] as const;

const demoRole = {
  code: 'admin',
  description: 'Full platform administration access.',
  isSystem: true,
  name: 'Administrator',
  permissions: demoPermissions.map((permission) => permission.code),
} as const;

interface DemoSeedArgs {
  datasetPath: string;
  email: string;
  force: boolean;
  includeEmbedding: boolean;
  includeGraph: boolean;
  ingest: boolean;
  password: string;
  reset: boolean;
  samplePath?: string;
}

interface DemoDataset {
  conversationTitle: string;
  documents: DemoDatasetDocument[];
  name: string;
  questions: DemoDatasetQuestion[];
  space: {
    description?: string;
    name: string;
    visibility?: 'PRIVATE' | 'PUBLIC';
  };
}

interface DemoDatasetDocument {
  description?: string;
  mimeType: string;
  path: string;
  title: string;
}

interface DemoDatasetQuestion {
  expectedAnswerHint?: string;
  expectedCitationHint?: string;
  question: string;
}

interface DemoDocumentResult {
  documentId: string;
  ingestion?: ReturnType<typeof summarizeIngestion>;
  ingestionError?: string;
  status: string;
  title: string;
}

async function main() {
  const args = parseArgs(globalThis.process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const authRepository = app.get(AuthRepository);
    const configService = app.get(ConfigService);
    const conversationService = app.get(ConversationService);
    const documentService = app.get(DocumentService);
    const enterpriseRepository = app.get(EnterpriseRepository);
    const ingestionService = app.get(IngestionService);
    const knowledgeSpaceService = app.get(KnowledgeSpaceService);
    const uploadService = app.get(UploadService);
    const userRepository = app.get(UserRepository);

    const dataset = await loadDataset(args);
    let user = await ensureDemoUser(args, {
      authRepository,
      enterpriseRepository,
      userRepository,
    });
    let context = createContext(user);

    if (args.reset) {
      await resetDemoData(context, dataset, {
        conversationService,
        knowledgeSpaceService,
      });
      user = await findDemoUser(args.email, userRepository);
      context = createContext(user);
    }

    const space = await findOrCreateSpace(context, dataset, knowledgeSpaceService);

    context.spaceIds = unique([...context.spaceIds, space.id]);

    const documents = await prepareDocuments(
      context,
      space,
      dataset,
      {
        documentService,
        ingestionService,
        uploadService,
      },
      args,
    );
    const conversation = await findOrCreateConversation(context, dataset, conversationService);
    const backendUrl = `http://localhost:${configService.getAppConfig().port}`;

    console.log(
      JSON.stringify(
        {
          backendUrl,
          commands: createCommands(user, conversation, space, dataset),
          conversation: {
            id: conversation.id,
            title: conversation.title,
          },
          dataset: {
            documentCount: dataset.documents.length,
            name: dataset.name,
            path: resolve(globalThis.process.cwd(), args.samplePath ?? args.datasetPath),
          },
          documents,
          frontendUrl: 'http://localhost:3001',
          ingest: {
            enabled: args.ingest,
            force: args.force,
            includeEmbedding: args.includeEmbedding,
            includeGraph: args.includeGraph,
          },
          login: {
            email: args.email,
            password: args.password,
          },
          questions: dataset.questions,
          reset: args.reset,
          space: {
            id: space.id,
            name: space.name,
          },
          user: {
            id: user.id,
            tenantId: user.tenantId,
          },
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
  const includeGraph = hasFlag(argv, '--graph') && !hasFlag(argv, '--no-graph');

  return {
    datasetPath: readOption(argv, '--dataset') ?? defaultDatasetPath,
    email: readOption(argv, '--email') ?? defaultEmail,
    force: !hasFlag(argv, '--no-force'),
    includeEmbedding: !hasFlag(argv, '--no-embedding'),
    includeGraph,
    ingest: !hasFlag(argv, '--no-ingest'),
    password: readOption(argv, '--password') ?? defaultPassword,
    reset: hasFlag(argv, '--reset'),
    samplePath: readOption(argv, '--sample'),
  };
}

async function loadDataset(args: DemoSeedArgs): Promise<DemoDataset> {
  if (args.samplePath) {
    return {
      conversationTitle: defaultConversationTitle,
      documents: [
        {
          description: 'MVP demo policy document.',
          mimeType: 'text/markdown',
          path: resolve(globalThis.process.cwd(), args.samplePath),
          title: readOption(globalThis.process.argv.slice(2), '--title') ?? defaultDocumentTitle,
        },
      ],
      name: 'mvp-demo-single-sample',
      questions: [
        {
          expectedCitationHint: '报销审批流程',
          question: '单笔超过10000元的报销需要谁审批？',
        },
      ],
      space: {
        description: '用于演示企业知识库入库、检索、Agent Trace 与 Citation 的样例空间。',
        name: defaultSpaceName,
        visibility: 'PRIVATE',
      },
    };
  }

  const datasetPath = resolve(globalThis.process.cwd(), args.datasetPath);
  const rawDataset = JSON.parse(await readFile(datasetPath, 'utf8')) as Partial<DemoDataset>;
  const datasetDir = dirname(datasetPath);
  const documents = (rawDataset.documents ?? []).map((document) => ({
    description: document.description,
    mimeType: document.mimeType,
    path: isAbsolute(document.path) ? document.path : resolve(datasetDir, document.path),
    title: document.title,
  }));

  if (!documents.length) {
    throw new Error(`Demo dataset has no documents: ${datasetPath}`);
  }

  return {
    conversationTitle: rawDataset.conversationTitle || defaultConversationTitle,
    documents,
    name: rawDataset.name || 'mvp-demo-dataset',
    questions: rawDataset.questions ?? [],
    space: {
      description:
        rawDataset.space?.description ??
        '用于演示企业知识库入库、检索、Agent Trace 与 Citation 的样例空间。',
      name: rawDataset.space?.name || defaultSpaceName,
      visibility: rawDataset.space?.visibility ?? 'PRIVATE',
    },
  };
}

async function ensureDemoUser(
  args: DemoSeedArgs,
  services: {
    authRepository: AuthRepository;
    enterpriseRepository: EnterpriseRepository;
    userRepository: UserRepository;
  },
): Promise<UserRecord> {
  for (const permission of demoPermissions) {
    await services.authRepository.upsertPermission(permission);
  }

  await services.authRepository.upsertRole(demoRole);

  for (const permissionCode of demoRole.permissions) {
    await services.authRepository.attachPermissionToRole(demoRole.code, permissionCode);
  }

  const tenant = await services.enterpriseRepository.upsertTenant({
    code: 'default',
    metadata: {
      demoSeed: true,
    },
    name: 'Default Tenant',
  });
  const organization = await services.enterpriseRepository.upsertOrganization({
    code: 'default-org',
    metadata: {
      demoSeed: true,
    },
    name: 'Default Organization',
    tenantId: tenant.id,
  });
  const department = await services.enterpriseRepository.upsertDepartment({
    code: 'ai-lab',
    metadata: {
      demoSeed: true,
    },
    name: 'AI Lab',
    organizationId: organization.id,
    tenantId: tenant.id,
  });
  const user = await services.userRepository.upsert({
    departmentId: department.id,
    email: args.email,
    isActive: true,
    name: 'Demo Administrator',
    organizationId: organization.id,
    passwordHash: await hash(args.password, passwordSaltRounds),
    tenantId: tenant.id,
  });

  await services.userRepository.assignRole(user.id, demoRole.code);
  await services.enterpriseRepository.assignUserEnterprise(user.id, {
    departmentId: department.id,
    organizationId: organization.id,
    tenantId: tenant.id,
  });
  await services.enterpriseRepository.backfillUserKnowledgeSpacesTenant(user.id, tenant.id);

  return findDemoUser(args.email, services.userRepository);
}

async function findDemoUser(email: string, userRepository: UserRepository): Promise<UserRecord> {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new Error(`Demo user not found: ${email}`);
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

async function resetDemoData(
  context: ExecutionContext,
  dataset: DemoDataset,
  services: {
    conversationService: ConversationService;
    knowledgeSpaceService: KnowledgeSpaceService;
  },
): Promise<void> {
  const conversations = await services.conversationService.list(context);

  for (const conversation of conversations) {
    if (conversation.title === dataset.conversationTitle) {
      await services.conversationService.delete(context, conversation.id);
    }
  }

  const spaces = await services.knowledgeSpaceService.list(context);

  for (const space of spaces) {
    if (space.name === dataset.space.name) {
      await services.knowledgeSpaceService.delete(context, space.id);
    }
  }
}

async function findOrCreateSpace(
  context: ExecutionContext,
  dataset: DemoDataset,
  knowledgeSpaceService: KnowledgeSpaceService,
): Promise<KnowledgeSpaceEntity> {
  const existingSpace = (await knowledgeSpaceService.list(context)).find(
    (space) => space.name === dataset.space.name,
  );

  if (existingSpace) {
    return existingSpace;
  }

  return knowledgeSpaceService.create(context, {
    description: dataset.space.description,
    name: dataset.space.name,
    visibility: dataset.space.visibility,
  });
}

async function prepareDocuments(
  context: ExecutionContext,
  space: KnowledgeSpaceEntity,
  dataset: DemoDataset,
  services: {
    documentService: DocumentService;
    ingestionService: IngestionService;
    uploadService: UploadService;
  },
  args: DemoSeedArgs,
): Promise<DemoDocumentResult[]> {
  const results: DemoDocumentResult[] = [];

  for (const datasetDocument of dataset.documents) {
    const document = await findOrUploadDocument(context, space, datasetDocument, services);
    const result: DemoDocumentResult = {
      documentId: document.id,
      status: document.status,
      title: document.title,
    };

    if (args.ingest) {
      try {
        const ingestion = await services.ingestionService.ingestDocument(context, document.id, {
          force: args.force,
          includeEmbedding: args.includeEmbedding,
          includeGraph: args.includeGraph,
        });

        result.ingestion = summarizeIngestion(ingestion);
        result.status = ingestion.status;
      } catch (error) {
        result.ingestionError =
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Document ingestion failed';
      }
    }

    results.push(result);
  }

  return results;
}

async function findOrUploadDocument(
  context: ExecutionContext,
  space: KnowledgeSpaceEntity,
  datasetDocument: DemoDatasetDocument,
  services: {
    documentService: DocumentService;
    uploadService: UploadService;
  },
): Promise<DocumentEntity> {
  const existingDocument = (await services.documentService.listBySpace(context, space.id)).find(
    (document) => document.title === datasetDocument.title,
  );

  if (existingDocument?.storageKey) {
    return existingDocument;
  }

  const buffer = await readFile(datasetDocument.path);

  const upload = await services.uploadService.uploadDocument(
    context,
    space.id,
    {
      autoIngest: false,
      description: datasetDocument.description,
      title: datasetDocument.title,
    },
    {
      buffer,
      mimetype: datasetDocument.mimeType,
      originalname: basename(datasetDocument.path),
      size: buffer.length,
    },
  );

  return upload.document;
}

async function findOrCreateConversation(
  context: ExecutionContext,
  dataset: DemoDataset,
  conversationService: ConversationService,
): Promise<ConversationEntity> {
  const existingConversation = (await conversationService.list(context)).find(
    (conversation) => conversation.title === dataset.conversationTitle,
  );

  if (existingConversation) {
    return existingConversation;
  }

  return conversationService.create(context, {
    title: dataset.conversationTitle,
  });
}

function createCommands(
  user: UserRecord,
  conversation: ConversationEntity,
  space: KnowledgeSpaceEntity,
  dataset: DemoDataset,
) {
  const question = dataset.questions[0]?.question ?? '请总结这个知识空间中的制度要点。';

  return {
    demoSeedNoGraph: 'pnpm demo:seed --reset --no-graph',
    demoSeedNoIngest: 'pnpm demo:seed --reset --no-ingest',
    demoSmoke: `pnpm demo:smoke ${user.id} ${conversation.id} "${question}" ${space.id}`,
    providerSmoke: 'pnpm provider:smoke',
  };
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
      errorMessage: stage.errorMessage,
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
