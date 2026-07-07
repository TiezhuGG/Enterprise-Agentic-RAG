import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { StorageClient } from './storage.client';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [StorageClient, StorageService],
  exports: [StorageService],
})
export class StorageModule {}
