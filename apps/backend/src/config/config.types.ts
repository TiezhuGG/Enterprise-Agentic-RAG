export const appEnvironments = ['local', 'development', 'test', 'staging', 'production'] as const;

export type AppEnvironment = (typeof appEnvironments)[number];

export interface AppConfig {
  env: AppEnvironment;
  port: number;
}

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  url: string;
}

export interface SearchConfig {
  url: string;
  index: string;
  username: string;
  password: string;
  enableFallback: boolean;
}

export interface MemoryConfig {
  redisTtlSeconds: number;
  windowSize: number;
  mem0ApiUrl: string;
  mem0ApiKey: string;
}

export interface GraphConfig {
  uri: string;
  username: string;
  password: string;
}

export interface MinioConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export interface MultimodalConfig {
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface EmbeddingConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  dimension: number;
}

export interface RerankerConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export interface LlmConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AgentConfig {
  maxIterations: number;
  enableGraph: boolean;
  enableMemory: boolean;
}

export interface AppConfiguration {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  search: SearchConfig;
  memory: MemoryConfig;
  graph: GraphConfig;
  minio: MinioConfig;
  multimodal: MultimodalConfig;
  jwt: JwtConfig;
  embedding: EmbeddingConfig;
  reranker: RerankerConfig;
  llm: LlmConfig;
  agent: AgentConfig;
}
