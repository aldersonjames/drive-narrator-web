import React, { useMemo, useState } from 'react';

import type { RouteSummary } from '../../../../shared/types/tripNarrator';
import { BreathingOrb, type OrbPhase } from './BreathingOrb';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import type { ConversationContext } from '../../hooks/useConversationalAI';

export interface ConversationConsoleProps {
  route?: RouteSummary;
  interestTags?: string[];
  profileId?: string;
  className?: string;
}

export const ConversationConsole: React.FC<ConversationConsoleProps> = ({
  route,
  interestTags,
  profileId,
  className,
}) => {
  const orderedInterests = useMemo(() => interestTags ?? [], [interestTags]);

  const conversationContext = useMemo<ConversationContext | undefined>(() => {
    if (!route && !orderedInterests.length && !profileId) {
      return undefined;
    }
    return {
      driveId: profileId,
      interests: orderedInterests.length ? orderedInterests : undefined,
    } satisfies ConversationContext;
  }, [profileId, orderedInterests, route]);

  const conversation = useVoiceConversation({ context: conversationContext });
  const [textInput, setTextInput] = useState('');

  const orbPhase: OrbPhase = conversation.error
    ? 'error'
    : conversation.isSpeaking
      ? 'speaking'
      : conversation.isListening
        ? 'listening'
        : 'idle';

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = textInput.trim();
    if (!trimmed) return;
    void conversation.sendMessage(trimmed);
    setTextInput('');
  };

  return (
    <section aria-label="Voice conversation" className={`conversation-console ${className ?? ''}`}>
      <header className="conversation-console__header">
        <div className="conversation-console__title">
          <span className="conversation-console__badge">Voice assistant</span>
          <h2>Drive Narrator</h2>
          <small>Ask for highlights, safety tips, or narration previews.</small>
          {route ? (
            <span className="conversation-console__route-meta" aria-live="polite">
              Active route · {route.pois.length} POIs curated · {route.distanceKm.toFixed(1)} km
            </span>
          ) : null}
        </div>
        <BreathingOrb
          phase={orbPhase}
          disabled={conversation.isProcessing}
          onStartListening={conversation.startConversation}
          onStop={conversation.stopConversation}
          messages={{
            idle: conversation.error ? 'Ready when you are' : 'Ready to listen',
            listening: 'Listening…',
            speaking: 'Responding…',
            error: conversation.error ?? 'Microphone problem',
          }}
        />
      </header>

      {conversation.error && (
        <div role="alert" className="conversation-alert conversation-console__alert">
          {conversation.error}
        </div>
      )}

      {conversation.transcript && (
        <div className="conversation-transcript conversation-console__transcript">
          <strong>Captured:</strong> {conversation.transcript}
        </div>
      )}

      <div className="conversation-console__log">
        <ul className="conversation-log" aria-live="polite">
          {conversation.conversationHistory.map((turn) => (
            <li key={turn.id} data-role={turn.role}>
              <small>
                {turn.role === 'user' ? 'You' : 'Assistant'} ·{' '}
                {new Date(turn.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </small>
              <span>{turn.content}</span>
            </li>
          ))}
        </ul>
      </div>

      <form className="conversation-input conversation-console__footer" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a question or request"
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
        />
        <button type="submit" disabled={!textInput.trim() || conversation.isProcessing}>
          Send
        </button>
      </form>
    </section>
  );
};

export default ConversationConsole;
