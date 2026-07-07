import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Socket } from 'node:net';
import { ConfigService } from '../../config';
import type { RedisReply } from './redis.types';

interface PendingCommand {
  reject(error: Error): void;
  resolve(reply: RedisReply): void;
}

interface ParsedReply {
  offset: number;
  value: RedisReply | Error;
}

const crlf = '\r\n';

const findLineEnd = (buffer: Buffer, offset: number): number => {
  for (let index = offset; index < buffer.length - 1; index += 1) {
    if (buffer[index] === 13 && buffer[index + 1] === 10) {
      return index;
    }
  }

  return -1;
};

const parseReply = (buffer: Buffer, offset = 0): ParsedReply | null => {
  if (offset >= buffer.length) {
    return null;
  }

  const prefix = String.fromCharCode(buffer[offset]);
  const lineEnd = findLineEnd(buffer, offset + 1);

  if (lineEnd === -1) {
    return null;
  }

  const line = buffer.subarray(offset + 1, lineEnd).toString('utf8');
  const nextOffset = lineEnd + 2;

  if (prefix === '+') {
    return { value: line, offset: nextOffset };
  }

  if (prefix === '-') {
    return { value: new Error(line), offset: nextOffset };
  }

  if (prefix === ':') {
    return { value: Number(line), offset: nextOffset };
  }

  if (prefix === '$') {
    const length = Number(line);

    if (length === -1) {
      return { value: null, offset: nextOffset };
    }

    const valueEnd = nextOffset + length;
    const replyEnd = valueEnd + 2;

    if (buffer.length < replyEnd) {
      return null;
    }

    return {
      value: buffer.subarray(nextOffset, valueEnd).toString('utf8'),
      offset: replyEnd,
    };
  }

  if (prefix === '*') {
    const count = Number(line);
    const values: RedisReply[] = [];
    let cursor = nextOffset;

    for (let index = 0; index < count; index += 1) {
      const parsed = parseReply(buffer, cursor);

      if (!parsed) {
        return null;
      }

      if (parsed.value instanceof Error) {
        return parsed;
      }

      values.push(parsed.value);
      cursor = parsed.offset;
    }

    return { value: values, offset: cursor };
  }

  return { value: new Error(`Unsupported Redis reply prefix: ${prefix}`), offset: nextOffset };
};

const encodeCommand = (args: string[]): string =>
  `*${args.length}${crlf}${args
    .map((arg) => {
      const value = Buffer.from(arg);

      return `$${value.length}${crlf}${arg}${crlf}`;
    })
    .join('')}`;

@Injectable()
export class RedisClient implements OnModuleDestroy {
  private buffer = Buffer.alloc(0);
  private connecting?: Promise<void>;
  private readonly pendingCommands: PendingCommand[] = [];
  private socket?: Socket;
  private readonly url: URL;

  constructor(configService: ConfigService) {
    this.url = new URL(configService.getRedisConfig().url);
  }

  async command(...args: string[]): Promise<RedisReply> {
    await this.ensureConnected();

    return new Promise<RedisReply>((resolve, reject) => {
      const socket = this.socket;

      if (!socket || socket.destroyed) {
        reject(new Error('Redis socket is not connected'));
        return;
      }

      this.pendingCommands.push({ resolve, reject });
      socket.write(encodeCommand(args));
    });
  }

  async onModuleDestroy(): Promise<void> {
    this.rejectPending(new Error('Redis client closed'));
    this.socket?.destroy();
    this.socket = undefined;
    this.connecting = undefined;
  }

  private async ensureConnected(): Promise<void> {
    if (this.socket && !this.socket.destroyed) {
      return;
    }

    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = new Promise<void>((resolve, reject) => {
      const socket = new Socket();
      const port = Number(this.url.port || 6379);
      const host = this.url.hostname || 'localhost';

      socket.on('data', (data) => this.handleData(data));
      socket.on('error', (error) => {
        this.rejectPending(error);
      });
      socket.on('close', () => {
        this.socket = undefined;
        this.connecting = undefined;
      });
      socket.connect(port, host, () => {
        this.socket = socket;
        resolve();
      });
      socket.once('error', reject);
    });

    await this.connecting;
    await this.authenticateIfNeeded();
    await this.selectDatabaseIfNeeded();
  }

  private async authenticateIfNeeded(): Promise<void> {
    if (!this.url.password) {
      return;
    }

    if (this.url.username) {
      await this.command(
        'AUTH',
        decodeURIComponent(this.url.username),
        decodeURIComponent(this.url.password),
      );
      return;
    }

    await this.command('AUTH', decodeURIComponent(this.url.password));
  }

  private handleData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);

    while (this.pendingCommands.length > 0) {
      const parsed = parseReply(this.buffer);

      if (!parsed) {
        return;
      }

      this.buffer = this.buffer.subarray(parsed.offset);
      const pending = this.pendingCommands.shift();

      if (!pending) {
        continue;
      }

      if (parsed.value instanceof Error) {
        pending.reject(parsed.value);
      } else {
        pending.resolve(parsed.value);
      }
    }
  }

  private rejectPending(error: Error): void {
    while (this.pendingCommands.length > 0) {
      this.pendingCommands.shift()?.reject(error);
    }
  }

  private async selectDatabaseIfNeeded(): Promise<void> {
    const database = this.url.pathname.replace('/', '');

    if (!database) {
      return;
    }

    await this.command('SELECT', database);
  }
}
