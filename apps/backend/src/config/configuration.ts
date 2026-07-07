import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';
import type { AppConfiguration } from './config.types';
import { validateEnv } from './env.schema';

export const CONFIGURATION = Symbol('CONFIGURATION');

const findEnvFile = (startDirectory: string): string | undefined => {
  let currentDirectory = startDirectory;

  while (true) {
    const candidate = resolve(currentDirectory, '.env');

    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDirectory = dirname(currentDirectory);

    if (parentDirectory === currentDirectory) {
      return undefined;
    }

    currentDirectory = parentDirectory;
  }
};

const loadLocalEnvFile = (): void => {
  const runtimeProcess = globalThis.process;
  const envFile = findEnvFile(runtimeProcess.cwd());

  if (envFile) {
    loadDotenv({ path: envFile, quiet: true });
  }
};

const readRuntimeEnv = (): Record<string, unknown> => {
  const runtimeProcess = globalThis.process;

  return runtimeProcess.env;
};

export const createConfiguration = (): AppConfiguration => {
  loadLocalEnvFile();

  const env = validateEnv(readRuntimeEnv());

  return {
    app: {
      env: env.APP_ENV,
      port: env.APP_PORT,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    minio: {
      endpoint: env.MINIO_ENDPOINT,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      bucket: env.MINIO_BUCKET,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    embedding: {
      apiUrl: env.EMBEDDING_API_URL,
      apiKey: env.EMBEDDING_API_KEY,
      model: env.EMBEDDING_MODEL,
      dimension: env.EMBEDDING_DIMENSION,
    },
    reranker: {
      apiUrl: env.RERANKER_API_URL,
      apiKey: env.RERANKER_API_KEY,
      model: env.RERANKER_MODEL,
    },
  };
};
