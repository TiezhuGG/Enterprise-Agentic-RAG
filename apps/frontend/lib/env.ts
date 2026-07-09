export const appEnvironments = ['local', 'development', 'test', 'staging', 'production'] as const;

export type AppEnvironment = (typeof appEnvironments)[number];

export interface FrontendRuntimeConfig {
  apiBaseUrl: string;
  runtime: {
    appEnv: AppEnvironment;
    isProduction: boolean;
  };
}

type FrontendRawEnv = {
  APP_ENV?: string;
  NEXT_PUBLIC_API_BASE_URL?: string;
};

const readRuntimeEnv = (): FrontendRawEnv => {
  return {
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  };
};

const requireValue = (env: FrontendRawEnv, key: keyof FrontendRawEnv): string => {
  const value = env[key]?.trim();

  if (!value) {
    throw new Error(`Missing frontend environment variable: ${key}`);
  }

  return value;
};

const validateAppEnv = (value: string): AppEnvironment => {
  if (appEnvironments.includes(value as AppEnvironment)) {
    return value as AppEnvironment;
  }

  throw new Error(`APP_ENV must be one of ${appEnvironments.join(', ')}`);
};

const validateApiBaseUrl = (value: string): string => {
  if (value.startsWith('/')) {
    return value;
  }

  try {
    new URL(value);
    return value;
  } catch {
    throw new Error('NEXT_PUBLIC_API_BASE_URL must be an absolute URL or root-relative path');
  }
};

const rawEnv = readRuntimeEnv();
const appEnv = validateAppEnv(requireValue(rawEnv, 'APP_ENV'));

export const frontendEnv: Readonly<FrontendRuntimeConfig> = Object.freeze({
  apiBaseUrl: validateApiBaseUrl(requireValue(rawEnv, 'NEXT_PUBLIC_API_BASE_URL')),
  runtime: {
    appEnv,
    isProduction: appEnv === 'production',
  },
});

export const apiBaseUrl = frontendEnv.apiBaseUrl;
export const runtimeConfig = frontendEnv.runtime;
