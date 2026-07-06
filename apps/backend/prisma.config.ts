import { defineConfig } from 'prisma/config';
import { createConfiguration } from './src/config/configuration';

const configuration = createConfiguration();

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node --project tsconfig.json src/infrastructure/prisma/seed.ts',
  },
  datasource: {
    url: configuration.database.url,
  },
});
