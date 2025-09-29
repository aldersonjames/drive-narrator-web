import React, { useMemo, useState } from 'react';

import type { RouteSummary } from '../../../../shared/types/tripNarrator';
import { BreathingOrb } from './BreathingOrb';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';

export interface ConversationConsoleProps {
  route?: RouteSummary;
  interestTags?: string[];
  profileId?: string;
  className?: string;
}

const panelStyle: React.CSSProperties = {
  borderRadius: '16px',
  border: '1px solid #E2E8F0',
  padding: '1.25rem',
  background: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const transcriptStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#475569',
  background: '#F8FAFC',
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
};

const conversationListStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  maxHeight: '240px',
  overflowY: 'auto',
};

const suggestionListStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

export const ConversationConsole: React.FC<ConversationConsoleProps> = ({
  route,
  interestTags,
  profileId,
  className,
}) => {
  const orderedInterests = useMemo(() => interestTags ?? [], [interestTags]);
  const conversation = useVoiceConversation({ route, interestTags: orderedInterests, profileId });
  const [textInput, setTextInput] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;
    void conversation.sendText(trimmed);
    setTextInput('');
  };

  return (
    <section aria-label="Voice conversation" className={className} style={panelStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Trip Narrator</h2>
          <p style={{ margin: 0, color: '#64748B', fontSize: '0.9rem' }}>
            Ask for highlights, safety tips, or narration previews.
          </p>
        </div>
        <BreathingOrb
          state={conversation.orbState}
          disabled={conversation.isProcessing}
          onStartListening={conversation.startVoice}
          onStartSpeaking={() => undefined}
          onStop={conversation.stopVoice}
          messages={{
            idle: conversation.error ? 'Ready when you are' : 'Ready to listen',
            listening: 'Listening…',
            speaking: 'Responding…',
            error: conversation.error ?? 'Microphone problem',
          }}
        />
      </header>

      {conversation.error && (
        <div role="alert" style={{ color: '#DC2626', fontSize: '0.9rem' }}>
          {conversation.error}
        </div>
      )}

      {conversation.transcript && (
        <div style={transcriptStyle}>
          <strong>Captured:</strong> {conversation.transcript}
        </div>
      )}

      <ul style={conversationListStyle} aria-live="polite">
        {conversation.conversation.map((turn) => (
          <li
            key={turn.id}
            style={{
              alignSelf: turn.role === 'traveler' ? 'flex-end' : 'flex-start',
              backgroundColor: turn.role === 'traveler' ? '#EEF2FF' : '#F8FAFC',
              color: '#1F2937',
              padding: '0.65rem 0.9rem',
              borderRadius: '12px',
              maxWidth: '90%',
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
            }}
          >
            <small style={{ display: 'block', color: '#64748B', marginBottom: '0.25rem' }}>
              {turn.role === 'traveler' ? 'You' : 'Assistant'} ·{' '}
              {new Date(turn.createdAt).toLocaleTimeString()}
            </small>
            <span>{turn.text}</span>
          </li>
        ))}
      </ul>

      {conversation.suggestions.length > 0 && (
        <div>
          <p style={{ marginBottom: '0.5rem', color: '#475569', fontSize: '0.9rem' }}>
            Suggested prompts:
          </p>
          <div style={suggestionListStyle}>
            {conversation.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void conversation.sendText(suggestion)}
                style={{
                  borderRadius: '999px',
                  border: '1px solid #CBD5F5',
                  padding: '0.35rem 0.75rem',
                  background: '#FFFFFF',
                  color: '#334155',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          placeholder="Type a question or request"
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          style={{
            flex: 1,
            borderRadius: '999px',
            border: '1px solid #CBD5F5',
            padding: '0.6rem 1rem',
            fontSize: '0.95rem',
          }}
        />
        <button
          type="submit"
          disabled={!textInput.trim() || conversation.isProcessing}
          style={{
            borderRadius: '999px',
            padding: '0.6rem 1.2rem',
            border: 'none',
            background: '#4F46E5',
            color: '#FFFFFF',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </form>
    </section>
  );
};

export default ConversationConsole;
