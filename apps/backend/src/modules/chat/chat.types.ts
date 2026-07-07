import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { ContextChunk } from '../retrieval';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  vectorLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  keywordLimit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12000)
  maxContextTokens?: number;
}

export interface ChatResponse {
  answer: string;
  citations: ChatCitation[];
}

export interface ChatCitation {
  chunkId: string;
  documentId: string;
  score: number;
  metadata: ContextChunk['metadata'];
}

export interface ChatStreamToken {
  token: string;
}
