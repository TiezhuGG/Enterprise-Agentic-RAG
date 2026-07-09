import { Inject, Injectable } from '@nestjs/common';
import { CONFIGURATION } from './configuration';
import type {
  AppConfig,
  AppConfiguration,
  AgentConfig,
  DatabaseConfig,
  EmbeddingConfig,
  GraphConfig,
  JwtConfig,
  LlmConfig,
  MemoryConfig,
  MinioConfig,
  MultimodalConfig,
  RedisConfig,
  RerankerConfig,
  SearchConfig,
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

  getSearchConfig(): Readonly<SearchConfig> {
    return this.config.search;
  }

  getMemoryConfig(): Readonly<MemoryConfig> {
    return this.config.memory;
  }

  getGraphConfig(): Readonly<GraphConfig> {
    return this.config.graph;
  }

  getMinioConfig(): Readonly<MinioConfig> {
    return this.config.minio;
  }

  getMultimodalConfig(): Readonly<MultimodalConfig> {
    return this.config.multimodal;
  }

  getJwtConfig(): Readonly<JwtConfig> {
    return this.config.jwt;
  }

  getEmbeddingConfig(): Readonly<EmbeddingConfig> {
    return this.config.embedding;
  }

  getRerankerConfig(): Readonly<RerankerConfig> {
    return this.config.reranker;
  }

  getLlmConfig(): Readonly<LlmConfig> {
    return this.config.llm;
  }

  getAgentConfig(): Readonly<AgentConfig> {
    return this.config.agent;
  }
}
