import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config';
import { createPrismaClient, type PrismaClientInstance } from './prisma.client';
import type { Prisma } from './generated/client';

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

  get tenant() {
    return this.client.tenant;
  }

  get organization() {
    return this.client.organization;
  }

  get department() {
    return this.client.department;
  }

  get knowledgeSpace() {
    return this.client.knowledgeSpace;
  }

  get spaceMember() {
    return this.client.spaceMember;
  }

  get document() {
    return this.client.document;
  }

  get documentCategory() {
    return this.client.documentCategory;
  }

  get documentTag() {
    return this.client.documentTag;
  }

  get documentTagAssignment() {
    return this.client.documentTagAssignment;
  }

  get documentVersion() {
    return this.client.documentVersion;
  }

  get documentContent() {
    return this.client.documentContent;
  }

  get chunk() {
    return this.client.chunk;
  }

  get chunkEmbedding() {
    return this.client.chunkEmbedding;
  }

  get pipelineJob() {
    return this.client.pipelineJob;
  }

  get pipelineEvent() {
    return this.client.pipelineEvent;
  }

  get conversation() {
    return this.client.conversation;
  }

  get message() {
    return this.client.message;
  }

  get multimodalAttachment() {
    return this.client.multimodalAttachment;
  }

  get executionRun() {
    return this.client.executionRun;
  }

  get executionTraceEvent() {
    return this.client.executionTraceEvent;
  }

  get governanceAuditEvent() {
    return this.client.governanceAuditEvent;
  }

  async healthCheck(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }

  async queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<T> {
    return this.client.$queryRaw<T>(query, ...values);
  }

  async executeRaw(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: unknown[]
  ): Promise<number> {
    return this.client.$executeRaw(query, ...values);
  }

  async $transaction<T>(fn: (client: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.client.$transaction(fn);
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }
}
