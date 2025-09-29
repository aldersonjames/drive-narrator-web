import React from 'react';

export interface BreathingOrbProps {
  status: 'idle' | 'listening' | 'speaking' | 'error';
  message?: string;
}

const STATUS_COPY: Record<BreathingOrbProps['status'], string> = {
  idle: 'Tap to start listening',
  listening: 'Listening…',
  speaking: 'Speaking…',
  error: 'Microphone problem',
};

export const BreathingOrb: React.FC<BreathingOrbProps> = ({ status, message }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`breathing-orb breathing-orb--${status}`}
      style={{
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: status === 'error' ? '#F87171' : '#6366F1',
        color: '#fff',
        animation: status === 'listening' ? 'pulse 1.5s infinite' : 'none',
      }}
    >
      <span>{message ?? STATUS_COPY[status]}</span>
    </div>
  );
};

export default BreathingOrb;
