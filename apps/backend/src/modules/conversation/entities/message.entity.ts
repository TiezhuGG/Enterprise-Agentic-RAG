export const messageRoles = ['USER', 'ASSISTANT', 'SYSTEM'] as const;
export type MessageRole = (typeof messageRoles)[number];

export interface MessageEntity {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
