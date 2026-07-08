import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { UserRepository } from '../user';
import { IngestionService } from './ingestion.service';

interface DemoIngestArgs {
  documentId: string;
  userId: string;
  spaceIds: string[];
  force: boolean;
  includeEmbedding: boolean;
  includeGraph: boolean;
}

const usage = [
  'Usage:',
  '  pnpm --filter @enterprise-agentic-rag/backend demo:ingest <documentId> <userId> [spaceIdsCsv] [--force] [--no-embedding] [--no-graph]',
  '',
  'Example:',
  '  pnpm --filter @enterprise-agentic-rag/backend demo:ingest clxdoc123 clxuser123 clxspace123 --force',
].join('\n');

async function main() {
  const args = parseArgs(globalThis.process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const ingestionService = app.get(IngestionService);
    const userRepository = app.get(UserRepository);
    const result = await ingestionService.ingestDocument(
      await createContext(args, userRepository),
      args.documentId,
      {
        force: args.force,
        includeEmbedding: args.includeEmbedding,
        includeGraph: args.includeGraph,
      },
    );

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): DemoIngestArgs {
  const flags = new Set(argv.filter((value) => value.startsWith('--')));
  const positional = argv.filter((value) => !value.startsWith('--'));
  const [documentId, userId, spaceIdsCsv] = positional;

  if (!documentId || !userId) {
    throw new Error(usage);
  }

  return {
    documentId,
    force: flags.has('--force'),
    includeEmbedding: !flags.has('--no-embedding'),
    includeGraph: !flags.has('--no-graph'),
    spaceIds: spaceIdsCsv
      ? spaceIdsCsv
          .split(',')
          .map((spaceId) => spaceId.trim())
          .filter(Boolean)
      : [],
    userId,
  };
}

async function createContext(
  args: DemoIngestArgs,
  userRepository: UserRepository,
): Promise<ExecutionContext> {
  const user = await userRepository.findById(args.userId);

  if (!user) {
    throw new Error(`User not found: ${args.userId}`);
  }

  return {
    departmentId: user.departmentId ?? undefined,
    metadata: {
      source: 'demo-ingest',
    },
    organizationId: user.organizationId ?? undefined,
    permissions: unique(user.roles.flatMap((role) => role.permissions)),
    roles: user.roles.map((role) => role.code),
    spaceIds: args.spaceIds.length > 0 ? args.spaceIds : user.spaceIds,
    tenantId: user.tenantId ?? undefined,
    userId: args.userId,
  };
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Demo ingest failed');
  globalThis.process.exitCode = 1;
});
