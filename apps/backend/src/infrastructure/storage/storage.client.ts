import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '../../config';

const defaultRegion = 'us-east-1';

@Injectable()
export class StorageClient {
  private readonly bucket: string;
  private readonly client: Client;

  constructor(configService: ConfigService) {
    const minioConfig = configService.getMinioConfig();
    const endpoint = new URL(minioConfig.endpoint);
    const port = endpoint.port ? Number(endpoint.port) : endpoint.protocol === 'https:' ? 443 : 80;

    this.bucket = minioConfig.bucket;
    this.client = new Client({
      endPoint: endpoint.hostname,
      port,
      useSSL: endpoint.protocol === 'https:',
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });
  }

  getClient(): Client {
    return this.client;
  }

  getBucket(): string {
    return this.bucket;
  }

  async ensureBucket(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);

    if (!exists) {
      await this.client.makeBucket(this.bucket, defaultRegion);
    }
  }
}
