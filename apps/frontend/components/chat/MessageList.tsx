'use client';

import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '@/store/chat.store';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage: ChatMessage | null;
}

export function MessageList({ messages, streamingMessage }: MessageListProps) {
  const visibleMessages = streamingMessage ? [...messages, streamingMessage] : messages;

  return (
    <section className="message-list" aria-label="Messages">
      {visibleMessages.length === 0 ? (
        <div className="message-list__empty">
          <h1>Enterprise Assistant</h1>
          <p>Ask a question grounded in your knowledge spaces.</p>
        </div>
      ) : (
        visibleMessages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
    </section>
  );
}
