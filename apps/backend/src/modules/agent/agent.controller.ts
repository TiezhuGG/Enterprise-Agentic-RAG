import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { RequestContextService, type ExecutionContext } from '../../common';
import { CurrentUser, JwtAuthGuard, type AuthenticatedUser } from '../auth';
import { AgentService } from './agent.service';
import { AgentChatRequestDto, type AgentEvent, type AgentResponse } from './agent.types';

interface SseResponse {
  end(): void;
  flushHeaders?: () => void;
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
}

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly requestContextService: RequestContextService,
  ) {}

  @Post('chat')
  execute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: AgentChatRequestDto,
  ): Promise<AgentResponse> {
    return this.agentService.execute(this.createExecutionContext(user), request);
  }

  @Post('chat/stream')
  async executeStream(
    @CurrentUser() user: AuthenticatedUser,
    @Body() request: AgentChatRequestDto,
    @Res() response: SseResponse,
  ): Promise<void> {
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('Content-Type', 'text/event-stream');
    response.flushHeaders?.();

    for await (const event of this.agentService.executeStream(
      this.createExecutionContext(user),
      request,
    )) {
      response.write(this.encodeEvent(event));
    }

    response.end();
  }

  private createExecutionContext(user: AuthenticatedUser): ExecutionContext {
    return this.requestContextService.create(user);
  }

  private encodeEvent(event: AgentEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }
}
