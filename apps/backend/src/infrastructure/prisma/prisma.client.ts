import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/client';

export type PrismaClientInstance = PrismaClient;

export const createPrismaClient = (databaseUrl: string): PrismaClientInstance =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
