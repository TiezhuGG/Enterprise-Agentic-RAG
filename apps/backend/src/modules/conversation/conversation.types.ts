import type { MessageRole } from './entities/message.entity';

export interface CreateMessageInput {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}
