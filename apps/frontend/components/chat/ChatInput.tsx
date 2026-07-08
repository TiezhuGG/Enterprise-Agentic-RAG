'use client';

import { FormEvent, useState } from 'react';

interface ChatInputProps {
  disabled?: boolean;
  onSubmit: (message: string) => void;
}

export function ChatInput({ disabled = false, onSubmit }: ChatInputProps) {
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

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        aria-label="Question"
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask about enterprise knowledge..."
        rows={3}
        value={value}
      />
      <button disabled={disabled || !value.trim()} type="submit">
        Send
      </button>
    </form>
  );
}
