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
    <section aria-label="Voice conversation" className={`conversation-console ${className ?? ''}`}>
      <header className="conversation-console__header">
        <div className="conversation-console__title">
          <span className="conversation-console__badge">Voice assistant</span>
          <h2>Trip Narrator</h2>
          <small>Ask for highlights, safety tips, or narration previews.</small>
          {route ? (
            <span className="conversation-console__route-meta" aria-live="polite">
              Active route · {route.pois.length} POIs curated · {route.distanceKm.toFixed(1)} km
            </span>
          ) : null}
        </div>
        <BreathingOrb
          phase={conversation.orbState}
          disabled={conversation.isProcessing}
          onStartListening={conversation.startVoice}
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
          {conversation.conversation.map((turn) => (
            <li key={turn.id} data-role={turn.role}>
              <small>
                {turn.role === 'traveler' ? 'You' : 'Assistant'} ·{' '}
                {new Date(turn.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </small>
              <span>{turn.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {conversation.suggestions.length > 0 && (
        <div className="conversation-console__suggestions">
          <p className="conversation-suggestions-title">Suggested prompts</p>
          <div className="conversation-suggestions">
            {conversation.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void conversation.sendText(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

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
