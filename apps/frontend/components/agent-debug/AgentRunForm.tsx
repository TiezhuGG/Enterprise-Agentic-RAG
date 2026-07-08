'use client';

import { FormEvent } from 'react';
import type { AgentDebugRunConfig } from '@/store/agent-debug.store';

interface AgentRunFormProps {
  conversationId: string | null;
  conversations: Array<{ id: string; title: string; updatedAt: string }>;
  disabled?: boolean;
  onConversationChange: (conversationId: string) => void;
  onQuestionChange: (question: string) => void;
  onRun: () => void;
  onRunConfigChange: (config: Partial<AgentDebugRunConfig>) => void;
  question: string;
  runConfig: AgentDebugRunConfig;
}

const numericFields: Array<{
  key: keyof AgentDebugRunConfig;
  label: string;
  max: number;
  min: number;
}> = [
  { key: 'limit', label: 'Limit', max: 20, min: 1 },
  { key: 'vectorLimit', label: 'Vector', max: 200, min: 1 },
  { key: 'keywordLimit', label: 'Keyword', max: 200, min: 1 },
  { key: 'maxContextTokens', label: 'Context', max: 12000, min: 1 },
];

export function AgentRunForm({
  conversationId,
  conversations,
  disabled = false,
  onConversationChange,
  onQuestionChange,
  onRun,
  onRunConfigChange,
  question,
  runConfig,
}: AgentRunFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRun();
  };

  return (
    <form className="agent-debug-form" onSubmit={handleSubmit}>
      <div className="agent-debug-form__top">
        <label className="workbench-field" htmlFor="agent-debug-conversation">
          <span>Conversation</span>
          <select
            className="workbench-select"
            disabled={disabled || conversations.length === 0}
            id="agent-debug-conversation"
            onChange={(event) => onConversationChange(event.target.value)}
            value={conversationId ?? ''}
          >
            {conversations.length === 0 ? <option value="">No conversations</option> : null}
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title || 'Debug Session'} ·{' '}
                {new Date(conversation.updatedAt).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>

        <div className="agent-debug-config">
          {numericFields.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <input
                disabled={disabled}
                max={field.max}
                min={field.min}
                onChange={(event) =>
                  onRunConfigChange({
                    [field.key]: Number(event.target.value),
                  })
                }
                type="number"
                value={runConfig[field.key]}
              />
            </label>
          ))}
        </div>
      </div>

      <label className="agent-debug-question" htmlFor="agent-debug-question">
        <span>Question</span>
        <textarea
          disabled={disabled}
          id="agent-debug-question"
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="Ask a question and inspect the Agent execution..."
          rows={5}
          value={question}
        />
      </label>

      <div className="agent-debug-form__actions">
        <button
          className="workbench-button"
          disabled={disabled || !conversationId || !question.trim()}
          type="submit"
        >
          Run Agent
        </button>
      </div>
    </form>
  );
}
