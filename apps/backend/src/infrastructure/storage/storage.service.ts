import { Injectable } from '@nestjs/common';
import type { Readable } from 'node:stream';
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
  constructor(private readonly storageClient: StorageClient) {}

  async uploadObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.storageClient.ensureBucket();
    await this.storageClient
      .getClient()
      .putObject(this.storageClient.getBucket(), key, buffer, buffer.length, {
        'Content-Type': contentType,
      });
  }

  async getObject(key: string): Promise<StoredObject> {
    await this.storageClient.ensureBucket();
    const client = this.storageClient.getClient();
    const bucket = this.storageClient.getBucket();
    const [objectStream, objectStat] = await Promise.all([
      client.getObject(bucket, key),
      client.statObject(bucket, key),
    ]);

    return {
      key,
      buffer: await streamToBuffer(objectStream),
      contentType: objectStat.metaData?.['content-type'],
      size: objectStat.size,
    };
  }

  async deleteObject(key: string): Promise<void> {
    await this.storageClient.ensureBucket();
    await this.storageClient.getClient().removeObject(this.storageClient.getBucket(), key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.storageClient.ensureBucket();
      await this.storageClient.getClient().statObject(this.storageClient.getBucket(), key);
      return true;
    } catch (error) {
      if (isObjectNotFoundError(error)) {
        return false;
      }

      throw error;
    }
  }
}
