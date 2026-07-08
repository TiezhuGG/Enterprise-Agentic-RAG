import type { ExecutionContext } from '../../common';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { ChatRequestDto, ChatResponse } from '../chat/chat.types';
import type { AgentCitation, AgentState, AgentTraceEntry } from './graph/agent.state';

export class AgentChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  conversationId!: string;

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  attachmentIds?: string[];
}

export interface AgentRunInput {
  conversationId: string;
  context: ExecutionContext;
  input: ChatRequestDto;
}

export interface AgentExecuteInput {
  context: ExecutionContext;
  request: AgentChatRequestDto;
}

export interface AgentRunResult extends ChatResponse {
  verified: boolean;
}

export interface AgentResponse {
  executionId: string;
  answer: string;
  citations: AgentCitation[];
  metadata: {
    verified: boolean;
    usedGraph: boolean;
    usedMemory: boolean;
    trace: AgentTraceEntry[];
  };
}

export type AgentEventType =
  'thought' | 'retrieval' | 'graph' | 'token' | 'citation' | 'done' | 'error';

export interface AgentEvent<TData = unknown> {
  type: AgentEventType;
  data: TData;
}

export interface PlannerDecision {
  needsGraph: boolean;
  needsRetrieval: boolean;
}

export interface AgentNode {
  run(state: AgentState): Promise<AgentState>;
}

export interface AgentWorkflowTrace {
  iterations: number;
  visitedNodes: string[];
}
