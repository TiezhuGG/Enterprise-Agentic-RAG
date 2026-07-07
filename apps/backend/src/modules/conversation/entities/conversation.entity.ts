export const conversationStatuses = ['ACTIVE', 'DELETED'] as const;
export type ConversationStatus = (typeof conversationStatuses)[number];

export interface ConversationEntity {
  id: string;
  title: string;
  status: ConversationStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
