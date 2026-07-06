import { Inject, Injectable } from '@nestjs/common';
import { CONFIGURATION } from './configuration';
import type {
  AppConfig,
  AppConfiguration,
  DatabaseConfig,
  MinioConfig,
  RedisConfig,
} from './config.types';

@Injectable()
export class ConfigService {
  constructor(@Inject(CONFIGURATION) private readonly config: AppConfiguration) {}

  get(): Readonly<AppConfiguration>;
  get<K extends keyof AppConfiguration>(key: K): Readonly<AppConfiguration[K]>;
  get<K extends keyof AppConfiguration>(key?: K) {
    if (key) {
      return this.config[key];
    }

    return this.config;
  }

  getAppConfig(): Readonly<AppConfig> {
    return this.config.app;
  }

  getDatabaseConfig(): Readonly<DatabaseConfig> {
    return this.config.database;
  }

  getRedisConfig(): Readonly<RedisConfig> {
    return this.config.redis;
  }

  getMinioConfig(): Readonly<MinioConfig> {
    return this.config.minio;
  }
}
