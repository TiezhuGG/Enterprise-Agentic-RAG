import { z } from 'zod';
import { appEnvironments } from './config.types';

const requiredString = (name: string) =>
  z
    .string({
      error: `${name} is required`,
    })
    .trim()
    .min(1, `${name} cannot be empty`);

const requiredUrl = (name: string) => requiredString(name).url(`${name} must be a valid URL`);

export const envSchema = z.object({
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
  DATABASE_URL: requiredUrl('DATABASE_URL'),
  REDIS_URL: requiredUrl('REDIS_URL'),
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
