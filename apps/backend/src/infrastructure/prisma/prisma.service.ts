import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config';
import { createPrismaClient, type PrismaClientInstance } from './prisma.client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: PrismaClientInstance;

  constructor(configService: ConfigService) {
    const { url } = configService.getDatabaseConfig();
    this.client = createPrismaClient(url);
  }

  get user() {
    return this.client.user;
  }

  get role() {
    return this.client.role;
  }

  get permission() {
    return this.client.permission;
  }

  get userRole() {
    return this.client.userRole;
  }

  get rolePermission() {
    return this.client.rolePermission;
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
