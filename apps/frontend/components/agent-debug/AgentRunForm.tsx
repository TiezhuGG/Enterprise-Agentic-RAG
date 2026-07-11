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
  { key: 'limit', label: '结果数', max: 20, min: 1 },
  { key: 'vectorLimit', label: '向量召回', max: 200, min: 1 },
  { key: 'keywordLimit', label: '全文召回', max: 200, min: 1 },
  { key: 'maxContextTokens', label: '上下文', max: 12000, min: 1 },
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
          <span>会话</span>
          <select
            className="workbench-select"
            disabled={disabled || conversations.length === 0}
            id="agent-debug-conversation"
            onChange={(event) => onConversationChange(event.target.value)}
            value={conversationId ?? ''}
          >
            {conversations.length === 0 ? <option value="">暂无会话</option> : null}
            {conversations.map((conversation) => (
              <option key={conversation.id} value={conversation.id}>
                {conversation.title || '调试会话'} ·{' '}
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
        <span>问题</span>
        <textarea
          disabled={disabled}
          id="agent-debug-question"
          onChange={(event) => onQuestionChange(event.target.value)}
          placeholder="输入一个问题，用于检查智能体执行链路"
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
          运行智能体
        </button>
      </div>
    </form>
  );
}
