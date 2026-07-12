import { Injectable } from '@nestjs/common';
import {
  createAppServiceUnavailableException,
  postProvider,
  postProviderJson,
} from '../../../common';
import { ConfigService } from '../../../config';
import type { ChatMessage } from '../chat.types';
import type { LlmChatOptions, LlmProvider } from './llm.provider';

interface OpenAiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
}

interface OpenAiChatCompletionChunk {
  choices?: Array<{
    delta?: {
      content?: unknown;
    };
  }>;
}

@Injectable()
export class OpenAiCompatibleLlmProvider implements LlmProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly temperature: number;
  private readonly maxTokens: number;

  constructor(configService: ConfigService) {
    const llmConfig = configService.getLlmConfig();

    this.apiUrl = llmConfig.apiUrl;
    this.apiKey = llmConfig.apiKey;
    this.model = llmConfig.model;
    this.temperature = llmConfig.temperature;
    this.maxTokens = llmConfig.maxTokens;
  }

  async chat(messages: ChatMessage[], options: LlmChatOptions = {}): Promise<string> {
    const payload = await postProviderJson<OpenAiChatCompletionResponse>({
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      body: this.createBody(messages, false, options.maxTokens),
      errorCode: 'LLM_UNAVAILABLE',
      timeoutMs: options.timeoutMs,
    });
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== 'string') {
      throw createAppServiceUnavailableException('LLM_UNAVAILABLE', '大模型返回格式异常');
    }

    return content;
  }

  async *stream(messages: ChatMessage[]): AsyncIterable<string> {
    const response = await postProvider({
      apiKey: this.apiKey,
      apiUrl: this.apiUrl,
      body: this.createBody(messages, true),
      errorCode: 'LLM_UNAVAILABLE',
    });

    if (!response.body) {
      throw createAppServiceUnavailableException('LLM_UNAVAILABLE');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    for await (const chunk of response.body) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const token = this.parseStreamLine(line);

        if (token) {
          yield token;
        }
      }
    }

    buffer += decoder.decode();

    if (buffer) {
      const token = this.parseStreamLine(buffer);

      if (token) {
        yield token;
      }
    }
  }

  private createBody(
    messages: ChatMessage[],
    stream: boolean,
    maxTokens = this.maxTokens,
  ): Record<string, unknown> {
    return {
      max_tokens: maxTokens,
      messages,
      model: this.model,
      stream,
      temperature: this.temperature,
    };
  }

  private parseStreamLine(line: string): string | null {
    const trimmedLine = line.trim();

    if (!trimmedLine.startsWith('data:')) {
      return null;
    }

    const data = trimmedLine.slice('data:'.length).trim();

    if (!data || data === '[DONE]') {
      return null;
    }

    const payload = JSON.parse(data) as OpenAiChatCompletionChunk;
    const content = payload.choices?.[0]?.delta?.content;

    return typeof content === 'string' ? content : null;
  }
}
