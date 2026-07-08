import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../../common';
import { RetrievalService, type ContextChunk, type RetrievalRequest } from '../../retrieval';

@Injectable()
export class RetrievalTool {
  constructor(private readonly retrievalService: RetrievalService) {}

  retrieve(context: ExecutionContext, request: RetrievalRequest): Promise<ContextChunk[]> {
    return this.retrievalService.retrieve(context, request);
  }
}
