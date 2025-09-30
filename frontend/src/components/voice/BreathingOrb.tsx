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
}

const PHASE_COLORS: Record<OrbPhase, string> = {
  idle: 'rgba(87, 199, 255, 0.45)',
  listening: 'rgba(99, 102, 241, 0.65)',
  processing: 'rgba(236, 72, 153, 0.6)',
  speaking: 'rgba(16, 185, 129, 0.65)',
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
}) => {
  const resolvedPhase = phase ?? state ?? 'idle';
  const energy = useMotionValue(0.35);
  const glow = useSpring(energy, { stiffness: 70, damping: 18 });
  const scale = useTransform(glow, (v) => 0.88 + v * 0.3);
  const aura = useTransform(glow, (v) => `0 0 80px ${v * 120}px ${PHASE_COLORS[resolvedPhase]}`);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (resolvedPhase === 'listening' || resolvedPhase === 'speaking') {
      energy.set(0.6);
      intervalRef.current = window.setInterval(() => {
        energy.set(randomEnergy());
      }, 900);
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
  }, [resolvedPhase, energy]);

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

  return (
    <div className={`orb-stack ${className ?? ''}`} data-phase={phase}>
      <motion.button
        type="button"
        onClick={() => {
          if (disabled) return;
          if (onTap) onTap();
          else if (resolvedPhase === 'idle') onStartListening?.();
          else if (resolvedPhase === 'speaking') onStop?.();
        }}
        className="orb-button"
        style={{ boxShadow: aura }}
        animate={{
          background: PHASE_COLORS[resolvedPhase],
          cursor: disabled ? 'default' : 'pointer',
        }}
        transition={{ type: 'spring', stiffness: 90, damping: 24 }}
        aria-live="polite"
        aria-label={displayCaption}
      >
        <motion.span
          className="orb-core"
          style={{ scale }}
          transition={{ type: 'spring', stiffness: 110, damping: 14 }}
        />
        <motion.span className="orb-ring" animate={{ opacity: phase === 'idle' ? 0.3 : 0.7 }} />
      </motion.button>
      <div className="orb-caption">
        <strong>{displayCaption}</strong>
        {subCaption ? <span>{subCaption}</span> : null}
      </div>
    </div>
  );
};

export default BreathingOrb;

export type BreathingOrbState = OrbPhase;
