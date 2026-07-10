import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import baseConfig from '../../eslint.config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...baseConfig,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];

export default config;
