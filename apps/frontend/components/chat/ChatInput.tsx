'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import type { ChatAttachment } from '@/store/chat.store';

interface ChatInputProps {
  attachments: ChatAttachment[];
  disabled?: boolean;
  onAttach: (file: File) => void;
  onRemoveAttachment: (clientId: string) => void;
  onSubmit: (message: string) => void;
}

export function ChatInput({
  attachments,
  disabled = false,
  onAttach,
  onRemoveAttachment,
  onSubmit,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = value.trim();

    if (!message || disabled) {
      return;
    }

    onSubmit(message);
    setValue('');
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    files.forEach(onAttach);
    event.target.value = '';
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      {attachments.length > 0 ? (
        <div className="chat-input__attachments">
          {attachments.map((attachment) => (
            <span
              className={`chat-input__attachment chat-input__attachment--${attachment.status}`}
              key={attachment.clientId}
            >
              <span>{attachment.filename}</span>
              <small>
                {attachment.status === 'uploading'
                  ? 'Uploading'
                  : attachment.status === 'ready'
                    ? attachment.type
                    : (attachment.error ?? 'Failed')}
              </small>
              <button
                aria-label={`Remove ${attachment.filename}`}
                disabled={disabled && attachment.status === 'uploading'}
                onClick={() => onRemoveAttachment(attachment.clientId)}
                type="button"
              >
                x
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <textarea
        aria-label="Question"
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask about enterprise knowledge..."
        rows={3}
        value={value}
      />
      <div className="chat-input__actions">
        <input
          accept="image/*,audio/*,video/*"
          disabled={disabled}
          hidden
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="chat-input__attach"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          Attach
        </button>
        <button disabled={disabled || !value.trim()} type="submit">
          Send
        </button>
      </div>
    </form>
  );
}
