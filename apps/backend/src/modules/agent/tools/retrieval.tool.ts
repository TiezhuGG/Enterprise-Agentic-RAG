import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../../common';
import { RetrievalService, type ContextChunk, type RetrievalRequest } from '../../retrieval';
import type { AgentTool } from './tool.types';

export interface RetrievalToolInput {
  context: ExecutionContext;
  request: RetrievalRequest;
}

@Injectable()
export class RetrievalTool implements AgentTool<RetrievalToolInput, ContextChunk[]> {
  readonly description = 'Retrieve relevant knowledge chunks using hybrid retrieval.';
  readonly name = 'retrieval' as const;

  constructor(private readonly retrievalService: RetrievalService) {}

  invoke(input: RetrievalToolInput): Promise<ContextChunk[]> {
    return this.retrieve(input.context, input.request);
  }

  retrieve(context: ExecutionContext, request: RetrievalRequest): Promise<ContextChunk[]> {
    return this.retrievalService.retrieve(context, request);
  }
}
