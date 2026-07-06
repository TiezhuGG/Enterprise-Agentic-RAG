import type { NextConfig } from 'next';
import './lib/load-local-env';
import { frontendEnv } from './lib/env';

const nextConfig: NextConfig = {
  env: {
    APP_ENV: frontendEnv.runtime.appEnv,
    NEXT_PUBLIC_API_BASE_URL: frontendEnv.apiBaseUrl,
  },
};

export default nextConfig;
