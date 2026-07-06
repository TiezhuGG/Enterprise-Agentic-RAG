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
  MINIO_ENDPOINT: requiredUrl('MINIO_ENDPOINT'),
  MINIO_ACCESS_KEY: requiredString('MINIO_ACCESS_KEY'),
  MINIO_SECRET_KEY: requiredString('MINIO_SECRET_KEY'),
  MINIO_BUCKET: requiredString('MINIO_BUCKET'),
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
