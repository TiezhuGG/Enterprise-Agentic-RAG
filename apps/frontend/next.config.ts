import type { NextConfig } from 'next';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import './lib/load-local-env';
import { frontendEnv } from './lib/env';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const standaloneOutputEnabled = globalThis.process.env.NEXT_STANDALONE === 'true';

const nextConfig: NextConfig = {
  env: {
    APP_ENV: frontendEnv.runtime.appEnv,
    NEXT_PUBLIC_API_BASE_URL: frontendEnv.apiBaseUrl,
  },
  ...(standaloneOutputEnabled
    ? {
        output: 'standalone',
        outputFileTracingRoot: join(currentDirectory, '../..'),
      }
    : {}),
};

export default nextConfig;
