import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { ConfigModule } from '../../config';
import { AuthModule } from '../auth';
import { RetrievalModule } from '../retrieval';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { LLM_PROVIDER } from './providers/llm.provider';
import { OpenAiCompatibleLlmProvider } from './providers/openai-compatible.provider';
import { PromptBuilder } from './prompt/prompt.builder';

@Module({
  imports: [AuthModule, ConfigModule, RequestContextModule, RetrievalModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    PromptBuilder,
    {
      provide: LLM_PROVIDER,
      useClass: OpenAiCompatibleLlmProvider,
    },
  ],
  exports: [ChatService],
})
export class ChatModule {}
