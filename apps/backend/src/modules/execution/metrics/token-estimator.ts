import type { ChatMessage } from '../../chat/chat.types';

const tokenPattern = /[\p{Script=Han}]|[A-Za-z0-9]+(?:[-_./][A-Za-z0-9]+)*|[^\s\p{Script=Han}]/gu;
const messageOverheadTokens = 4;

export class TokenEstimator {
  countText(content: string): number {
    if (!content.trim()) {
      return 0;
    }

    const matches = content.match(tokenPattern);

    return matches?.length ?? 0;
  }

  countMessages(messages: ChatMessage[]): number {
    return messages.reduce(
      (sum, message) => sum + this.countText(message.content) + messageOverheadTokens,
      0,
    );
  }
}
