import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config as loadDotenv } from 'dotenv';

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

export const loadLocalEnv = (): void => {
  const runtimeProcess = globalThis.process;
  const envFile = findEnvFile(runtimeProcess.cwd());

  if (envFile) {
    loadDotenv({ path: envFile, quiet: true });
  }
};

loadLocalEnv();
