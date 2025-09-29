import React, { useEffect, useMemo, useState } from 'react';

export type BreathingOrbState = 'idle' | 'listening' | 'speaking' | 'error';

export interface BreathingOrbMessages {
  idle?: string;
  listening?: string;
  speaking?: string;
  error?: string;
}

export interface BreathingOrbProps {
  state?: BreathingOrbState;
  onStateChange?: (next: BreathingOrbState) => void;
  onStartListening?: () => void;
  onStartSpeaking?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  messages?: BreathingOrbMessages;
  className?: string;
}

const DEFAULT_MESSAGES: Required<BreathingOrbMessages> = {
  idle: 'Ready to listen',
  listening: 'Listening…',
  speaking: 'Speaking…',
  error: 'Microphone problem',
};

const wrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const orbButtonStyle = (current: BreathingOrbState): React.CSSProperties => ({
  width: '96px',
  height: '96px',
  borderRadius: '50%',
  border: 'none',
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: '#FFFFFF',
  background: current === 'error' ? '#F87171' : '#6366F1',
  boxShadow:
    current === 'listening'
      ? '0 0 0 8px rgba(99, 102, 241, 0.15), 0 0 25px rgba(99,102,241,0.45)'
      : '0 12px 28px rgba(15, 23, 42, 0.18)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  transform: current === 'listening' ? 'scale(1.05)' : 'scale(1)',
  fontSize: '0.95rem',
});

const controlGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const controlRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const controlButtonStyle = (active = false): React.CSSProperties => ({
  borderRadius: '8px',
  border: '1px solid',
  borderColor: active ? '#6366F1' : '#CBD5F5',
  padding: '0.45rem 0.75rem',
  backgroundColor: active ? 'rgba(99, 102, 241, 0.12)' : '#FFFFFF',
  color: active ? '#312E81' : '#1F2937',
  cursor: 'pointer',
  fontSize: '0.85rem',
});

export const BreathingOrb: React.FC<BreathingOrbProps> = ({
  state: controlledState,
  onStateChange,
  onStartListening,
  onStartSpeaking,
  onStop,
  disabled = false,
  messages,
  className,
}) => {
  const isControlled = controlledState !== undefined;
  const [internalState, setInternalState] = useState<BreathingOrbState>(controlledState ?? 'idle');

  useEffect(() => {
    if (isControlled && controlledState && controlledState !== internalState) {
      setInternalState(controlledState);
    }
  }, [controlledState, internalState, isControlled]);

  const currentState = isControlled && controlledState ? controlledState : internalState;

  const mergedMessages = useMemo(
    () => ({
      ...DEFAULT_MESSAGES,
      ...messages,
    }),
    [messages],
  );

  const setState = (next: BreathingOrbState) => {
    if (!isControlled) {
      setInternalState(next);
    }
    onStateChange?.(next);
  };

  const handleStartListening = () => {
    if (disabled) return;
    onStartListening?.();
    setState('listening');
  };

  const handleStartSpeaking = () => {
    if (disabled) return;
    onStartSpeaking?.();
    setState('speaking');
  };

  const handleStop = () => {
    if (disabled) return;
    onStop?.();
    setState('idle');
  };

  const handleOrbClick = () => {
    if (disabled) return;
    if (currentState === 'listening' || currentState === 'speaking') {
      handleStop();
    } else if (currentState === 'idle') {
      handleStartListening();
    }
  };

  const orbAriaLabel =
    currentState === 'listening' || currentState === 'speaking'
      ? 'Stop voice capture'
      : 'Start listening';

  const canStartSpeaking = currentState === 'listening' || currentState === 'speaking';
  const showStop = currentState !== 'idle';

  return (
    <div className={className} style={wrapperStyle} data-state={currentState}>
      <button
        type="button"
        onClick={handleOrbClick}
        aria-label={orbAriaLabel}
        disabled={disabled}
        style={orbButtonStyle(currentState)}
      >
        <span aria-hidden="true">●</span>
      </button>

      <div style={controlGroupStyle}>
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={currentState !== 'idle'}
          data-testid="breathing-orb-status"
        >
          <span>{mergedMessages[currentState]}</span>
        </div>

        <div style={controlRowStyle}>
          <button
            type="button"
            onClick={handleStartListening}
            disabled={disabled || currentState === 'listening'}
            style={controlButtonStyle(currentState === 'listening')}
          >
            Start listening
          </button>
          <button
            type="button"
            onClick={handleStartSpeaking}
            disabled={disabled || !canStartSpeaking}
            style={controlButtonStyle(currentState === 'speaking')}
          >
            Start speaking
          </button>
          {showStop && (
            <button
              type="button"
              onClick={handleStop}
              disabled={disabled}
              style={controlButtonStyle(false)}
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreathingOrb;
