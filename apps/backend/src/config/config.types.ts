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

export interface MinioConfig {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfiguration {
  app: AppConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  minio: MinioConfig;
  jwt: JwtConfig;
}
