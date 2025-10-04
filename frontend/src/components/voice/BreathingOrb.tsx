import React, { useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export type OrbPhase = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export interface BreathingOrbProps {
  phase?: OrbPhase;
  /** alias for legacy usage */
  state?: OrbPhase;
  caption?: string;
  subCaption?: string;
  onTap?: () => void;
  onStartListening?: () => void;
  onStop?: () => void;
  disabled?: boolean;
  className?: string;
  messages?: Partial<Record<OrbPhase, string>>;
  amplitude?: number;
  speaker?: 'traveler' | 'assistant' | 'none';
  stateLabel?: string;
}

const BASE_COLORS: Record<'traveler' | 'assistant' | 'none', string> = {
  traveler: 'rgba(59, 130, 246, 0.65)',
  assistant: 'rgba(217, 119, 6, 0.65)',
  none: 'rgba(148, 163, 184, 0.45)',
};

const STATE_COLORS: Record<OrbPhase, string> = {
  idle: BASE_COLORS.none,
  listening: BASE_COLORS.traveler,
  processing: 'rgba(236, 72, 153, 0.6)',
  speaking: BASE_COLORS.assistant,
  error: 'rgba(248, 113, 113, 0.75)',
};

const CAPTION_DEFAULTS: Record<OrbPhase, string> = {
  idle: 'Tap to start listening',
  listening: 'Listening for your next trip…',
  processing: 'Mapping possibilities…',
  speaking: 'Narrating your story…',
  error: 'Microphone unavailable',
};

const randomEnergy = () => 0.25 + Math.random() * 0.55;

const clampAmplitude = (value?: number) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

export const BreathingOrb: React.FC<BreathingOrbProps> = ({
  phase,
  state,
  caption,
  subCaption,
  onTap,
  onStartListening,
  onStop,
  disabled,
  className,
  messages,
  amplitude,
  speaker = 'none',
  stateLabel,
}) => {
  const resolvedPhase = phase ?? state ?? 'idle';
  const baseColor = speaker !== 'none' ? BASE_COLORS[speaker] : STATE_COLORS[resolvedPhase];
  const energy = useMotionValue(0.35);
  const glow = useSpring(energy, { stiffness: 70, damping: 18 });
  const scale = useTransform(glow, (v) => 0.88 + v * 0.3);
  const aura = useTransform(glow, (v) => `0 0 80px ${v * 120}px ${baseColor}`);
  const intervalRef = useRef<number>();
  const normalizedAmplitude = clampAmplitude(amplitude);

  useEffect(() => {
    if (resolvedPhase === 'listening' || resolvedPhase === 'speaking') {
      energy.set(0.6 + normalizedAmplitude * 0.5);
      intervalRef.current = window.setInterval(() => {
        energy.set(0.45 + normalizedAmplitude * 0.55 + randomEnergy() * 0.1);
      }, 450);
    } else if (resolvedPhase === 'processing') {
      energy.set(0.8);
    } else {
      energy.set(0.35);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [resolvedPhase, normalizedAmplitude, energy]);

  useEffect(() => {
    if (resolvedPhase !== 'listening' && resolvedPhase !== 'speaking') {
      energy.stop();
    }
  }, [resolvedPhase, energy]);

  const captionMap = useMemo(() => ({ ...CAPTION_DEFAULTS, ...messages }), [messages]);
  const displayCaption = useMemo(
    () => caption ?? captionMap[resolvedPhase],
    [caption, captionMap, resolvedPhase],
  );

  const handlePress = () => {
    if (disabled) return;
    if (onTap) onTap();
    else if (resolvedPhase === 'idle' || resolvedPhase === 'processing') onStartListening?.();
    else if (resolvedPhase === 'listening' || resolvedPhase === 'speaking') onStop?.();
  };

  return (
    <div className={`orb-stack ${className ?? ''}`} data-phase={resolvedPhase}>
      <motion.button
        type="button"
        onClick={handlePress}
        className="orb-button"
        style={{ boxShadow: aura }}
        animate={{
          background: baseColor,
          cursor: disabled ? 'default' : 'pointer',
        }}
        transition={{ type: 'spring', stiffness: 90, damping: 24 }}
        aria-live="polite"
        aria-label={stateLabel ?? displayCaption}
      >
        <motion.span
          className="orb-core"
          style={{ scale }}
          transition={{ type: 'spring', stiffness: 110, damping: 14 }}
        />
        <motion.span
          className="orb-ring"
          animate={{ opacity: resolvedPhase === 'idle' ? 0.3 : 0.8 }}
        />
      </motion.button>
      <div className="orb-caption">
        <strong>{displayCaption}</strong>
        {subCaption ? <span>{subCaption}</span> : null}
      </div>
      {stateLabel ? (
        <span className="mt-1 text-xs font-medium uppercase tracking-wide text-white/70">
          {stateLabel}
        </span>
      ) : null}
    </div>
  );
};

export default BreathingOrb;

export type BreathingOrbState = OrbPhase;
