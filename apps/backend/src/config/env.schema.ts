import { z } from 'zod';
import { appEnvironments, multimodalProviderModes } from './config.types';

const requiredString = (name: string) =>
  z
    .string({
      error: `${name} is required`,
    })
    .trim()
    .min(1, `${name} cannot be empty`);

const requiredUrl = (name: string) => requiredString(name).url(`${name} must be a valid URL`);

const booleanFlag = (name: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === 'boolean') {
        return value;
      }

      if (typeof value === 'string') {
        const normalizedValue = value.trim().toLowerCase();

        if (normalizedValue === 'true') {
          return true;
        }

        if (normalizedValue === 'false') {
          return false;
        }
      }

      return value;
    },
    z.boolean({ error: `${name} must be true or false` }),
  );

const providerMode = (name: string) =>
  z.enum(multimodalProviderModes, {
    error: `${name} must be metadata or openai-compatible`,
  });

const optionalProviderString = () => z.string().trim().default('');

const validateConditionalProvider = (
  env: Record<string, unknown>,
  ctx: z.RefinementCtx,
  prefix: 'OCR' | 'ASR' | 'VIDEO',
): void => {
  if (env[`${prefix}_PROVIDER`] !== 'openai-compatible') {
    return;
  }

  const apiUrl = env[`${prefix}_API_URL`];
  const apiKey = env[`${prefix}_API_KEY`];
  const model = env[`${prefix}_MODEL`];

  if (typeof apiUrl !== 'string' || !apiUrl.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: `${prefix}_API_URL is required when ${prefix}_PROVIDER=openai-compatible`,
      path: [`${prefix}_API_URL`],
    });
  } else if (!z.string().url().safeParse(apiUrl).success) {
    ctx.addIssue({
      code: 'custom',
      message: `${prefix}_API_URL must be a valid URL`,
      path: [`${prefix}_API_URL`],
    });
  }

  if (typeof apiKey !== 'string' || !apiKey.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: `${prefix}_API_KEY is required when ${prefix}_PROVIDER=openai-compatible`,
      path: [`${prefix}_API_KEY`],
    });
  }

  if (typeof model !== 'string' || !model.trim()) {
    ctx.addIssue({
      code: 'custom',
      message: `${prefix}_MODEL is required when ${prefix}_PROVIDER=openai-compatible`,
      path: [`${prefix}_MODEL`],
    });
  }
};

export const envSchema = z
  .object({
    APP_ENV: z.enum(appEnvironments, {
      error: 'APP_ENV must be one of local, development, test, staging, production',
    }),
    APP_PORT: z.coerce
      .number({
        error: 'APP_PORT is required',
      })
      .int('APP_PORT must be an integer')
      .min(1, 'APP_PORT must be greater than 0')
      .max(65535, 'APP_PORT must be less than or equal to 65535'),
    CORS_ORIGINS: z.string().trim().default('http://localhost:3001,http://127.0.0.1:3001'),
    DATABASE_URL: requiredUrl('DATABASE_URL'),
    REDIS_URL: requiredUrl('REDIS_URL'),
    ELASTICSEARCH_URL: requiredUrl('ELASTICSEARCH_URL'),
    ELASTICSEARCH_INDEX: requiredString('ELASTICSEARCH_INDEX'),
    ELASTICSEARCH_USERNAME: z.string().trim().default(''),
    ELASTICSEARCH_PASSWORD: z.string().trim().default(''),
    ELASTICSEARCH_ENABLE_FALLBACK: booleanFlag('ELASTICSEARCH_ENABLE_FALLBACK'),
    REDIS_MEMORY_TTL: z.coerce
      .number({
        error: 'REDIS_MEMORY_TTL is required',
      })
      .int('REDIS_MEMORY_TTL must be an integer')
      .min(1, 'REDIS_MEMORY_TTL must be greater than 0'),
    MEMORY_WINDOW_SIZE: z.coerce
      .number({
        error: 'MEMORY_WINDOW_SIZE is required',
      })
      .int('MEMORY_WINDOW_SIZE must be an integer')
      .min(1, 'MEMORY_WINDOW_SIZE must be greater than 0'),
    MEM0_API_URL: requiredUrl('MEM0_API_URL'),
    MEM0_API_KEY: requiredString('MEM0_API_KEY'),
    NEO4J_URI: requiredUrl('NEO4J_URI'),
    NEO4J_USERNAME: requiredString('NEO4J_USERNAME'),
    NEO4J_PASSWORD: requiredString('NEO4J_PASSWORD'),
    MINIO_ENDPOINT: requiredUrl('MINIO_ENDPOINT'),
    MINIO_ACCESS_KEY: requiredString('MINIO_ACCESS_KEY'),
    MINIO_SECRET_KEY: requiredString('MINIO_SECRET_KEY'),
    MINIO_BUCKET: requiredString('MINIO_BUCKET'),
    MULTIMODAL_MAX_FILE_SIZE_MB: z.coerce
      .number({
        error: 'MULTIMODAL_MAX_FILE_SIZE_MB is required',
      })
      .int('MULTIMODAL_MAX_FILE_SIZE_MB must be an integer')
      .min(1, 'MULTIMODAL_MAX_FILE_SIZE_MB must be greater than 0')
      .max(100, 'MULTIMODAL_MAX_FILE_SIZE_MB must be less than or equal to 100'),
    MULTIMODAL_ALLOWED_MIME_TYPES: requiredString('MULTIMODAL_ALLOWED_MIME_TYPES'),
    OCR_PROVIDER: providerMode('OCR_PROVIDER').default('metadata'),
    OCR_API_URL: optionalProviderString(),
    OCR_API_KEY: optionalProviderString(),
    OCR_MODEL: optionalProviderString(),
    ASR_PROVIDER: providerMode('ASR_PROVIDER').default('metadata'),
    ASR_API_URL: optionalProviderString(),
    ASR_API_KEY: optionalProviderString(),
    ASR_MODEL: optionalProviderString(),
    VIDEO_PROVIDER: providerMode('VIDEO_PROVIDER').default('metadata'),
    VIDEO_API_URL: optionalProviderString(),
    VIDEO_API_KEY: optionalProviderString(),
    VIDEO_MODEL: optionalProviderString(),
    JWT_SECRET: requiredString('JWT_SECRET').min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: requiredString('JWT_EXPIRES_IN'),
    EMBEDDING_API_URL: requiredUrl('EMBEDDING_API_URL'),
    EMBEDDING_API_KEY: requiredString('EMBEDDING_API_KEY'),
    EMBEDDING_MODEL: requiredString('EMBEDDING_MODEL'),
    EMBEDDING_DIMENSION: z.coerce
      .number({
        error: 'EMBEDDING_DIMENSION is required',
      })
      .int('EMBEDDING_DIMENSION must be an integer')
      .min(1, 'EMBEDDING_DIMENSION must be greater than 0'),
    RERANKER_API_URL: requiredUrl('RERANKER_API_URL'),
    RERANKER_API_KEY: requiredString('RERANKER_API_KEY'),
    RERANKER_MODEL: requiredString('RERANKER_MODEL'),
    LLM_API_URL: requiredUrl('LLM_API_URL'),
    LLM_API_KEY: requiredString('LLM_API_KEY'),
    LLM_MODEL: requiredString('LLM_MODEL'),
    LLM_TEMPERATURE: z.coerce
      .number({
        error: 'LLM_TEMPERATURE is required',
      })
      .min(0, 'LLM_TEMPERATURE must be greater than or equal to 0')
      .max(2, 'LLM_TEMPERATURE must be less than or equal to 2'),
    LLM_MAX_TOKENS: z.coerce
      .number({
        error: 'LLM_MAX_TOKENS is required',
      })
      .int('LLM_MAX_TOKENS must be an integer')
      .min(1, 'LLM_MAX_TOKENS must be greater than 0'),
    AGENT_MAX_ITERATIONS: z.coerce
      .number({
        error: 'AGENT_MAX_ITERATIONS is required',
      })
      .int('AGENT_MAX_ITERATIONS must be an integer')
      .min(1, 'AGENT_MAX_ITERATIONS must be greater than 0'),
    AGENT_ENABLE_GRAPH: booleanFlag('AGENT_ENABLE_GRAPH'),
    AGENT_ENABLE_MEMORY: booleanFlag('AGENT_ENABLE_MEMORY'),
  })
  .superRefine((env, ctx) => {
    validateConditionalProvider(env, ctx, 'OCR');
    validateConditionalProvider(env, ctx, 'ASR');
    validateConditionalProvider(env, ctx, 'VIDEO');
  });

export type EnvSchema = z.infer<typeof envSchema>;

export const validateEnv = (rawEnv: Record<string, unknown>): EnvSchema => {
  const parsedEnv = envSchema.safeParse(rawEnv);

  if (!parsedEnv.success) {
    const details = parsedEnv.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return parsedEnv.data;
};
