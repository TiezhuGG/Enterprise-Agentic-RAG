#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultEnvFile = '.env.production';
const composeFile = 'docker/docker-compose.prod.yml';
const backendPackage = '@enterprise-agentic-rag/backend';

const requiredKeys = [
  'APP_ENV',
  'APP_PORT',
  'BACKEND_PORT',
  'FRONTEND_PORT',
  'CORS_ORIGINS',
  'DATABASE_URL',
  'REDIS_URL',
  'ELASTICSEARCH_URL',
  'ELASTICSEARCH_INDEX',
  'JWT_SECRET',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'NEO4J_URI',
  'NEO4J_USERNAME',
  'NEO4J_PASSWORD',
  'LLM_API_URL',
  'LLM_API_KEY',
  'LLM_MODEL',
  'EMBEDDING_API_URL',
  'EMBEDDING_API_KEY',
  'EMBEDDING_MODEL',
  'EMBEDDING_DIMENSION',
  'RERANKER_API_URL',
  'RERANKER_API_KEY',
  'RERANKER_MODEL',
  'NEXT_PUBLIC_API_BASE_URL',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
];

const helpText = `
Usage:
  node scripts/deploy-prod.mjs [options]

Options:
  --env <path>              Env file path. Default: .env.production
  --dry-run                 Print planned commands without executing them.
  --smoke-only              Do not build or start compose; run health wait and smoke steps only.
  --skip-build              Skip docker compose build.
  --seed                    Run the database seed (off by default).
  --skip-provider-smoke     Skip provider smoke.
  --demo                    Seed the demo dataset (off by default; resets demo data).
  --graph                   Run demo seed with graph extraction enabled.
  --allow-placeholders      Allow values containing "change-me".
  --help                    Show this help.

Examples:
  pnpm deploy:prod
  pnpm deploy:prod -- --skip-build
  pnpm deploy:prod -- --graph
  pnpm deploy:prod:dry-run
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(helpText.trim());
    return;
  }

  const env = loadEnv(args.envFile);
  preflight(env, args);

  if (args.dryRun) {
    printPlan(args, env);
    return;
  }

  if (!args.smokeOnly) {
    runCompose(args, ['config']);

    if (!args.skipBuild) {
      runCompose(args, ['build']);
    }

    runCompose(args, ['up', '-d']);
  }

  await waitForHttp(`http://127.0.0.1:${env.BACKEND_PORT || env.APP_PORT || '3000'}/health`, {
    label: 'backend /health',
  });
  await waitForHttp(`http://127.0.0.1:${env.FRONTEND_PORT || '3001'}`, {
    label: 'frontend',
  });

  runBackend(args, ['pnpm', '--filter', backendPackage, 'prisma:deploy']);

  if (args.seed) {
    runBackend(args, ['pnpm', '--filter', backendPackage, 'prisma:seed']);
  }

  if (!args.skipProviderSmoke) {
    runBackend(args, ['pnpm', '--filter', backendPackage, 'provider:smoke']);
  }

  if (args.demo) {
    runBackend(args, [
      'pnpm',
      '--filter',
      backendPackage,
      'demo:seed',
      '--reset',
      args.graph ? '--graph' : '--no-graph',
    ]);
  }

  console.log('');
  console.log('Deployment finished.');
  console.log(`Frontend: http://127.0.0.1:${env.FRONTEND_PORT || '3001'}`);
  console.log(`Backend:  http://127.0.0.1:${env.BACKEND_PORT || env.APP_PORT || '3000'}`);
  console.log('Next: sign in with a provisioned production account.');
}

function parseArgs(argv) {
  const args = {
    allowPlaceholders: false,
    dryRun: false,
    envFile: defaultEnvFile,
    graph: false,
    help: false,
    skipBuild: false,
    demo: false,
    skipProviderSmoke: false,
    seed: false,
    smokeOnly: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case '--allow-placeholders':
        args.allowPlaceholders = true;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--env':
        args.envFile = argv[index + 1] ?? '';
        index += 1;
        break;
      case '--graph':
        args.graph = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--skip-build':
        args.skipBuild = true;
        break;
      case '--demo':
        args.demo = true;
        break;
      case '--skip-provider-smoke':
        args.skipProviderSmoke = true;
        break;
      case '--seed':
        args.seed = true;
        break;
      case '--smoke-only':
        args.smokeOnly = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!args.envFile) {
    throw new Error('--env requires a path');
  }

  return args;
}

function loadEnv(envFile) {
  const envPath = resolve(process.cwd(), envFile);

  if (!existsSync(envPath)) {
    throw new Error(
      `Missing ${envFile}. Copy .env.production.example to .env.production and edit it first.`,
    );
  }

  const env = {};
  const content = readFileSync(envPath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    env[key] = stripQuotes(rawValue);
  }

  return env;
}

function preflight(env, args) {
  const missingKeys = requiredKeys.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required env keys: ${missingKeys.join(', ')}`);
  }

  if (!args.allowPlaceholders) {
    const placeholderKeys = Object.entries(env)
      .filter(([, value]) => value.toLowerCase().includes('change-me'))
      .map(([key]) => key);

    if (placeholderKeys.length > 0) {
      throw new Error(
        `Replace placeholder values before deployment: ${placeholderKeys.join(', ')}`,
      );
    }
  }

  const warnings = [];

  if ((env.NEXT_PUBLIC_API_BASE_URL ?? '').includes('localhost')) {
    warnings.push(
      'NEXT_PUBLIC_API_BASE_URL points to localhost; use a public backend URL on servers.',
    );
  }

  if ((env.CORS_ORIGINS ?? '').includes('localhost')) {
    warnings.push('CORS_ORIGINS contains localhost; include the public frontend URL on servers.');
  }

  if (env.AGENT_ENABLE_GRAPH === 'true') {
    warnings.push('AGENT_ENABLE_GRAPH=true; make sure Neo4j and graph provider are stable.');
  }

  for (const warning of warnings) {
    console.warn(`Warning: ${warning}`);
  }
}

function printPlan(args, env) {
  const commands = [];

  if (!args.smokeOnly) {
    commands.push(composeCommand(args, ['config']));

    if (!args.skipBuild) {
      commands.push(composeCommand(args, ['build']));
    }

    commands.push(composeCommand(args, ['up', '-d']));
  }

  commands.push(`wait http://127.0.0.1:${env.BACKEND_PORT || env.APP_PORT || '3000'}/health`);
  commands.push(`wait http://127.0.0.1:${env.FRONTEND_PORT || '3001'}`);
  commands.push(
    composeCommand(args, [
      'exec',
      '-T',
      'backend',
      'pnpm',
      '--filter',
      backendPackage,
      'prisma:deploy',
    ]),
  );

  if (args.seed) {
    commands.push(
      composeCommand(args, [
        'exec',
        '-T',
        'backend',
        'pnpm',
        '--filter',
        backendPackage,
        'prisma:seed',
      ]),
    );
  }

  if (!args.skipProviderSmoke) {
    commands.push(
      composeCommand(args, [
        'exec',
        '-T',
        'backend',
        'pnpm',
        '--filter',
        backendPackage,
        'provider:smoke',
      ]),
    );
  }

  if (args.demo) {
    commands.push(
      composeCommand(args, [
        'exec',
        '-T',
        'backend',
        'pnpm',
        '--filter',
        backendPackage,
        'demo:seed',
        '--reset',
        args.graph ? '--graph' : '--no-graph',
      ]),
    );
  }

  console.log('Deployment dry run:');

  for (const command of commands) {
    console.log(`  ${command}`);
  }
}

function runCompose(args, composeArgs) {
  run('docker', composeBaseArgs(args).concat(composeArgs));
}

function runBackend(args, commandArgs) {
  runCompose(args, ['exec', '-T', 'backend', ...commandArgs]);
}

function composeCommand(args, composeArgs) {
  return ['docker', ...composeBaseArgs(args), ...composeArgs].join(' ');
}

function composeBaseArgs(args) {
  return ['compose', '--env-file', args.envFile, '-f', composeFile];
}

function run(command, args) {
  console.log('');
  console.log(`> ${[command, ...args].join(' ')}`);

  const result = spawnSync(command, args, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

async function waitForHttp(url, options) {
  const attempts = Number(process.env.DEPLOY_HEALTH_ATTEMPTS || 60);
  const intervalMs = Number(process.env.DEPLOY_HEALTH_INTERVAL_MS || 3000);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        console.log(`${options.label} is healthy.`);
        return;
      }
    } catch {
      // Retry until timeout.
    }

    if (attempt < attempts) {
      await sleep(intervalMs);
    }
  }

  throw new Error(`${options.label} did not become healthy at ${url}`);
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Deployment failed');
  process.exitCode = 1;
});
