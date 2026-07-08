import { Injectable } from '@nestjs/common';
import type { ExecutionContext } from '../../common';
import { AgentService } from '../agent/agent.service';
import type { ChatRequestDto, ChatResponse } from './chat.types';

@Injectable()
export class ChatService {
  constructor(private readonly agentService: AgentService) {}

  chat(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): Promise<ChatResponse> {
    return this.agentService.chat(context, conversationId, input);
  }

  stream(
    context: ExecutionContext,
    conversationId: string,
    input: ChatRequestDto,
  ): AsyncIterable<string> {
    return this.agentService.stream(context, conversationId, input);
  }
}
