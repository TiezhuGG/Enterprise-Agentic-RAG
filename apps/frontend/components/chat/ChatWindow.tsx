'use client';

import { useEffect, useState } from 'react';
import { AgentTracePanel } from '@/components/agent/AgentTracePanel';
import { CitationPanel } from '@/components/agent/CitationPanel';
import { useChatStore } from '@/store/chat.store';
import { ChatInput } from './ChatInput';
import { MessageList } from './MessageList';

export function ChatWindow() {
  const {
    attachments,
    authToken,
    citations,
    conversationId,
    conversations,
    createConversation,
    deleteConversation,
    error,
    initialize,
    messages,
    removeAttachment,
    selectConversation,
    sendMessage,
    setAuthToken,
    streaming,
    streamingMessage,
    trace,
    uploadAttachment,
  } = useChatStore();
  const [tokenDraft, setTokenDraft] = useState(authToken);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    setTokenDraft(authToken);
  }, [authToken]);

  return (
    <main className="assistant-shell">
      <section className="conversation-sidebar" aria-label="Conversations">
        <div className="conversation-sidebar__top">
          <div>
            <h2>Conversations</h2>
            <span>{conversations.length}</span>
          </div>
          <button onClick={() => void createConversation()} type="button">
            +
          </button>
        </div>

        <label className="token-field">
          <span>Token</span>
          <input
            onBlur={() => setAuthToken(tokenDraft)}
            onChange={(event) => setTokenDraft(event.target.value)}
            type="password"
            value={tokenDraft}
          />
        </label>

        <div className="conversation-list">
          {conversations.map((conversation) => (
            <button
              className={
                conversation.id === conversationId
                  ? 'conversation-item active'
                  : 'conversation-item'
              }
              key={conversation.id}
              onClick={() => void selectConversation(conversation.id)}
              type="button"
            >
              <span>{conversation.title || 'New Chat'}</span>
              <small>{new Date(conversation.updatedAt).toLocaleDateString()}</small>
            </button>
          ))}
        </div>

        {conversationId ? (
          <button
            className="conversation-delete"
            onClick={() => void deleteConversation(conversationId)}
            type="button"
          >
            Delete
          </button>
        ) : null}
      </section>

      <section className="chat-workspace">
        <MessageList messages={messages} streamingMessage={streamingMessage} />
        {error ? <div className="chat-error">{error}</div> : null}
        <ChatInput
          attachments={attachments}
          disabled={streaming}
          onAttach={(file) => void uploadAttachment(file)}
          onRemoveAttachment={removeAttachment}
          onSubmit={(message) => void sendMessage(message)}
        />
      </section>

      <section className="assistant-inspector" aria-label="Assistant details">
        <AgentTracePanel trace={trace} />
        <CitationPanel citations={citations} />
      </section>
    </main>
  );
}
