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
      corsOrigins: env.CORS_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      env: env.APP_ENV,
      ingestionWorkerEnabled: env.INGESTION_WORKER_ENABLED,
      port: env.APP_PORT,
    },
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      url: env.REDIS_URL,
    },
    search: {
      url: env.ELASTICSEARCH_URL,
      index: env.ELASTICSEARCH_INDEX,
      username: env.ELASTICSEARCH_USERNAME,
      password: env.ELASTICSEARCH_PASSWORD,
      enableFallback: env.ELASTICSEARCH_ENABLE_FALLBACK,
    },
    memory: {
      redisTtlSeconds: env.REDIS_MEMORY_TTL,
      windowSize: env.MEMORY_WINDOW_SIZE,
      mem0ApiUrl: env.MEM0_API_URL,
      mem0ApiKey: env.MEM0_API_KEY,
    },
    graph: {
      uri: env.NEO4J_URI,
      username: env.NEO4J_USERNAME,
      password: env.NEO4J_PASSWORD,
    },
    minio: {
      endpoint: env.MINIO_ENDPOINT,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      bucket: env.MINIO_BUCKET,
    },
    multimodal: {
      allowedMimeTypes: env.MULTIMODAL_ALLOWED_MIME_TYPES.split(',')
        .map((mimeType) => mimeType.trim())
        .filter(Boolean),
      maxFileSizeBytes: env.MULTIMODAL_MAX_FILE_SIZE_MB * 1024 * 1024,
    },
    ocr: {
      provider: env.OCR_PROVIDER,
      apiUrl: env.OCR_API_URL,
      apiKey: env.OCR_API_KEY,
      model: env.OCR_MODEL,
    },
    pdfOcr: {
      enabled: env.PDF_OCR_ENABLED,
      maxPages: env.PDF_OCR_MAX_PAGES,
      renderWidth: env.PDF_OCR_RENDER_WIDTH,
      maxImageDimension: env.PDF_OCR_MAX_IMAGE_DIMENSION,
      concurrency: env.PDF_OCR_CONCURRENCY,
      minTextLength: env.PDF_OCR_MIN_TEXT_LENGTH,
    },
    asr: {
      provider: env.ASR_PROVIDER,
      apiUrl: env.ASR_API_URL,
      apiKey: env.ASR_API_KEY,
      model: env.ASR_MODEL,
    },
    videoUnderstanding: {
      provider: env.VIDEO_PROVIDER,
      apiUrl: env.VIDEO_API_URL,
      apiKey: env.VIDEO_API_KEY,
      model: env.VIDEO_MODEL,
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
    llm: {
      apiUrl: env.LLM_API_URL,
      apiKey: env.LLM_API_KEY,
      model: env.LLM_MODEL,
      temperature: env.LLM_TEMPERATURE,
      maxTokens: env.LLM_MAX_TOKENS,
    },
    agent: {
      maxIterations: env.AGENT_MAX_ITERATIONS,
      enableGraph: env.AGENT_ENABLE_GRAPH,
      enableMemory: env.AGENT_ENABLE_MEMORY,
    },
    cost: {
      currency: env.COST_CURRENCY,
      llmInputPer1kTokens: env.COST_LLM_INPUT_PER_1K,
      llmOutputPer1kTokens: env.COST_LLM_OUTPUT_PER_1K,
      embeddingPer1kTokens: env.COST_EMBEDDING_PER_1K,
    },
  };
};
