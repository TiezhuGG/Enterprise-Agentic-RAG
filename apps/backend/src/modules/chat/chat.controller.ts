import { Body, Controller, Param, Post, Res, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { ChatRequestDto, type ChatResponse } from './chat.types';
import { ChatService } from './chat.service';

interface SseResponse {
  end(): void;
  flushHeaders?: () => void;
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post(':conversationId')
  chat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() chatRequestDto: ChatRequestDto,
  ): Promise<ChatResponse> {
    return this.chatService.chat(this.createExecutionContext(user), conversationId, chatRequestDto);
  }

  @Post(':conversationId/stream')
  async stream(
    @CurrentUser() user: AuthenticatedUser,
    @Param('conversationId') conversationId: string,
    @Body() chatRequestDto: ChatRequestDto,
    @Res() response: SseResponse,
  ): Promise<void> {
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('Content-Type', 'text/event-stream');
    response.flushHeaders?.();

    try {
      for await (const token of this.chatService.stream(
        this.createExecutionContext(user),
        conversationId,
        chatRequestDto,
      )) {
        response.write(`data: ${JSON.stringify({ token })}\n\n`);
      }
    } finally {
      response.write('data: [DONE]\n\n');
      response.end();
    }
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }
}
