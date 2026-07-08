import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import type { ExecutionContext } from '../../common';
import { AgentService } from '../agent';

interface DemoSmokeArgs {
  userId: string;
  conversationId: string;
  question: string;
  spaceIds: string[];
}

const usage = [
  'Usage:',
  '  pnpm --filter @enterprise-agentic-rag/backend demo:smoke <userId> <conversationId> <question> [spaceIdsCsv]',
  '',
  'Example:',
  '  pnpm --filter @enterprise-agentic-rag/backend demo:smoke clxuser123 clxconv123 "报销审批流程是什么？" clxspace123',
].join('\n');

async function main() {
  const args = parseArgs(globalThis.process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const agentService = app.get(AgentService);
    const response = await agentService.execute(createContext(args), {
      conversationId: args.conversationId,
      question: args.question,
    });

    console.log(
      JSON.stringify(
        {
          answerLength: response.answer.length,
          citationCount: response.citations.length,
          executionId: response.executionId,
          traceCount: response.metadata.trace.length,
          usedGraph: response.metadata.usedGraph,
          usedMemory: response.metadata.usedMemory,
          verified: response.metadata.verified,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): DemoSmokeArgs {
  const [userId, conversationId, question, spaceIdsCsv] = argv;

  if (!userId || !conversationId || !question) {
    throw new Error(usage);
  }

  return {
    conversationId,
    question,
    spaceIds: spaceIdsCsv
      ? spaceIdsCsv
          .split(',')
          .map((spaceId) => spaceId.trim())
          .filter(Boolean)
      : [],
    userId,
  };
}

function createContext(args: DemoSmokeArgs): ExecutionContext {
  return {
    metadata: {
      source: 'demo-smoke',
    },
    permissions: [],
    roles: [],
    spaceIds: args.spaceIds,
    userId: args.userId,
  };
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Demo smoke failed');
  globalThis.process.exitCode = 1;
});
