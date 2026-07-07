export type RedisReply = string | number | null | RedisReply[];

export interface RedisSetOptions {
  ttlSeconds?: number;
}
