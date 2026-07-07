import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config';
import { RedisClient } from './redis.client';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [RedisClient, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
