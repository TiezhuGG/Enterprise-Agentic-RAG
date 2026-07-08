import { Module } from '@nestjs/common';
import { RequestContextModule } from '../../common';
import { AgentModule } from '../agent';
import { AuthModule } from '../auth';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [AgentModule, AuthModule, RequestContextModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
