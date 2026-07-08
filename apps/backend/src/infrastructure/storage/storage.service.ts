import { Injectable } from '@nestjs/common';
import type { Readable } from 'node:stream';
import { ObservabilityService } from '../observability';
import { StorageClient } from './storage.client';
import type { StoredObject } from './storage.types';

const objectNotFoundCodes = new Set(['NoSuchKey', 'NotFound', 'NotFoundError']);

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const isObjectNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const codedError = error as Error & { code?: string };

  return codedError.code ? objectNotFoundCodes.has(codedError.code) : false;
};

@Injectable()
export class StorageService {
  constructor(
    private readonly observabilityService: ObservabilityService,
    private readonly storageClient: StorageClient,
  ) {}

  async healthCheck(): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.storageClient.ensureBucket();
      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        operation: 'healthCheck',
        status: 'success',
      });
    } catch (error) {
      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'healthCheck',
        status: 'failed',
      });
      throw error;
    }
  }

  async uploadObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.storageClient.ensureBucket();
      await this.storageClient
        .getClient()
        .putObject(this.storageClient.getBucket(), key, buffer, buffer.length, {
          'Content-Type': contentType,
        });
      this.observabilityService.recordStorage({
        contentType,
        durationMs: Date.now() - startedAt,
        operation: 'uploadObject',
        size: buffer.length,
        status: 'success',
      });
    } catch (error) {
      this.observabilityService.recordStorage({
        contentType,
        durationMs: Date.now() - startedAt,
        error,
        operation: 'uploadObject',
        size: buffer.length,
        status: 'failed',
      });
      throw error;
    }
  }

  async getObject(key: string): Promise<StoredObject> {
    const startedAt = Date.now();

    try {
      await this.storageClient.ensureBucket();
      const client = this.storageClient.getClient();
      const bucket = this.storageClient.getBucket();
      const [objectStream, objectStat] = await Promise.all([
        client.getObject(bucket, key),
        client.statObject(bucket, key),
      ]);
      const buffer = await streamToBuffer(objectStream);

      this.observabilityService.recordStorage({
        contentType: objectStat.metaData?.['content-type'],
        durationMs: Date.now() - startedAt,
        operation: 'getObject',
        size: objectStat.size,
        status: 'success',
      });

      return {
        key,
        buffer,
        contentType: objectStat.metaData?.['content-type'],
        size: objectStat.size,
      };
    } catch (error) {
      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'getObject',
        status: 'failed',
      });
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const startedAt = Date.now();

    try {
      await this.storageClient.ensureBucket();
      await this.storageClient.getClient().removeObject(this.storageClient.getBucket(), key);
      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        operation: 'deleteObject',
        status: 'success',
      });
    } catch (error) {
      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'deleteObject',
        status: 'failed',
      });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const startedAt = Date.now();

    try {
      await this.storageClient.ensureBucket();
      await this.storageClient.getClient().statObject(this.storageClient.getBucket(), key);
      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        operation: 'exists',
        status: 'success',
      });
      return true;
    } catch (error) {
      if (isObjectNotFoundError(error)) {
        this.observabilityService.recordStorage({
          durationMs: Date.now() - startedAt,
          operation: 'exists',
          status: 'success',
        });
        return false;
      }

      this.observabilityService.recordStorage({
        durationMs: Date.now() - startedAt,
        error,
        operation: 'exists',
        status: 'failed',
      });
      throw error;
    }
  }
}
