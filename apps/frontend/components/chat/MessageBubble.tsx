'use client';

import type { ChatMessage } from '@/store/chat.store';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <article className={`message-bubble message-bubble--${message.role}`}>
      <div className="message-bubble__meta">
        <span>
          {message.role === 'assistant' ? 'Assistant' : message.role === 'user' ? 'You' : 'System'}
        </span>
        {message.status === 'streaming' ? <span>Streaming</span> : null}
      </div>
      {message.attachments?.length ? (
        <div className="message-bubble__attachments">
          {message.attachments.map((attachment) => (
            <span key={attachment.id}>
              {attachment.type ?? 'ATTACHMENT'} · {attachment.filename}
            </span>
          ))}
        </div>
      ) : null}
      <div className="message-bubble__content">{renderMarkdown(message.content)}</div>
    </article>
  );
}

function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCodeBlock = false;

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre className="message-bubble__code" key={`code-${index}`}>
            <code>{codeBlock.join('\n')}</code>
          </pre>,
        );
        codeBlock = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }

      return;
    }

    if (inCodeBlock) {
      codeBlock.push(line);
      return;
    }

    const trimmedLine = line.trim();

    if (!trimmedLine) {
      elements.push(<div className="message-bubble__break" key={`break-${index}`} />);
      return;
    }

    if (trimmedLine.startsWith('#')) {
      elements.push(
        <strong className="message-bubble__heading" key={`heading-${index}`}>
          {trimmedLine.replace(/^#+\s*/, '')}
        </strong>,
      );
      return;
    }

    if (/^[-*]\s+/.test(trimmedLine)) {
      elements.push(
        <p className="message-bubble__list-item" key={`list-${index}`}>
          {trimmedLine.replace(/^[-*]\s+/, '')}
        </p>,
      );
      return;
    }

    elements.push(<p key={`p-${index}`}>{trimmedLine}</p>);
  });

  if (codeBlock.length > 0) {
    elements.push(
      <pre className="message-bubble__code" key="code-final">
        <code>{codeBlock.join('\n')}</code>
      </pre>,
    );
  }

  return elements;
}
