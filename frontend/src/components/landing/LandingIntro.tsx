import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, Variants } from 'framer-motion';

import '../../styles/landing-intro.css';

export interface LandingIntroProps {
  onSkip: () => void;
  onPlanTrip: () => void;
  onWatchTutorial: () => void;
}

const CTA_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const STROKE_COLORS = ['#ff0088', '#8df0cc', '#0d63f8'] as const;
const LETTER_WIDTH = 140;
const LETTER_GAP = 48;
const LINE_GAP = 160;

const LETTER_PATHS: Record<string, string[]> = {
  T: ['M0 0 H120', 'M60 0 V120'],
  R: ['M0 0 V120', 'M0 0 H70 Q110 0 110 40 Q110 80 70 80 H0', 'M0 80 L115 120'],
  I: ['M60 0 V120'],
  P: ['M0 0 V120', 'M0 0 H70 Q110 0 110 40 Q110 80 70 80 H0'],
  N: ['M0 120 V0', 'M0 0 L120 120', 'M120 120 V0'],
  A: ['M0 120 L60 0 L120 120', 'M25 70 H95'],
  O: ['M60 0 Q110 0 110 60 Q110 120 60 120 Q10 120 10 60 Q10 0 60 0 Z'],
  D: ['M0 0 V120', 'M0 0 H75 Q120 0 120 60 Q120 120 75 120 H0'],
  V: ['M0 0 L60 120 L120 0'],
  E: ['M0 0 H110', 'M0 0 V120', 'M0 60 H85', 'M0 120 H110'],
};

type StrokeDefinition = {
  d: string;
  color: string;
  translateX: number;
  translateY: number;
  rowWidth: number;
  direction: 'forward' | 'reverse';
  baseDelay: number;
};

const computeRowWidth = (word: string) => word.length * (LETTER_WIDTH + LETTER_GAP) - LETTER_GAP;

const buildWord = (
  word: string,
  rowIndex: number,
  baseDelay: number,
  direction: 'forward' | 'reverse',
): StrokeDefinition[] => {
  const y = rowIndex * LINE_GAP;
  const rowWidth = computeRowWidth(word);
  return [...word].flatMap((char, index) => {
    const segments = LETTER_PATHS[char];
    if (!segments) return [];
    const translateX = index * (LETTER_WIDTH + LETTER_GAP);
    return segments.map((path, segIdx) => ({
      d: path,
      color: STROKE_COLORS[index % STROKE_COLORS.length],
      baseDelay: baseDelay + index * 0.3 + segIdx * 0.12,
      translateX,
      translateY: y,
      rowWidth,
      direction,
    }));
  });
};

const driveWidth = computeRowWidth('DRIVE');
const narratorWidth = computeRowWidth('NARRATOR');
const STROKES: StrokeDefinition[] = [
  ...buildWord('DRIVE', 0, 0.2, 'forward'),
  ...buildWord('NARRATOR', 1, 1.7, 'reverse'),
];

const VIEWBOX_WIDTH = Math.max(driveWidth, narratorWidth) + 220;
const VIEWBOX_HEIGHT = LINE_GAP + 220;

const strokeVariants: Variants = {
  hidden: ({ length, direction }: { length: number; direction: 'forward' | 'reverse' }) => ({
    strokeDasharray: length,
    strokeDashoffset: direction === 'reverse' ? -length : length,
    opacity: 0,
  }),
  visible: ({ length, delay }: { length: number; delay: number }) => ({
    strokeDasharray: length,
    strokeDashoffset: 0,
    opacity: 1,
    transition: {
      strokeDashoffset: { delay, duration: 1.6, ease: [0.65, 0, 0.35, 1] },
      opacity: { delay, duration: 0.01 },
    },
  }),
};

const AnimatedStroke: React.FC<StrokeDefinition & { delay: number }> = ({
  d,
  color,
  delay,
  translateX,
  translateY,
  rowWidth,
  direction,
}) => {
  const ref = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState(1);

  useEffect(() => {
    if (ref.current) {
      setLength(ref.current.getTotalLength() || 1);
    }
  }, []);

  const offsetX = (VIEWBOX_WIDTH - rowWidth) / 2 + translateX;
  const offsetY = 90 + translateY;

  return (
    <motion.path
      ref={ref}
      d={d}
      transform={`translate(${offsetX} ${offsetY})`}
      stroke={color}
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      variants={strokeVariants}
      initial="hidden"
      animate="visible"
      custom={{ length, delay, direction }}
    />
  );
};

const PathWordmark: React.FC = () => {
  const strokes = useMemo(() => STROKES, []);
  const randomOffsets = useMemo(() => {
    let seed = Math.random();
    return strokes.map((stroke) => {
      seed = (seed * 9301 + 49297) % 233280;
      const random = seed / 233280;
      return stroke.baseDelay + 0.3 + random * 1.1;
    });
  }, [strokes]);
  return (
    <motion.svg
      className="landing-wordmark"
      role="img"
      aria-label="Drive Narrator"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      initial="hidden"
      animate="visible"
    >
      {strokes.map((stroke, idx) => (
        <AnimatedStroke key={idx} {...stroke} delay={randomOffsets[idx]} />
      ))}
    </motion.svg>
  );
};

export const LandingIntro: React.FC<LandingIntroProps> = ({
  onPlanTrip,
  onSkip,
  onWatchTutorial,
}) => {
  const buttonsVariant = useMemo(() => 'visible', []);

  return (
    <div className="landing-intro-shell">
      <button type="button" className="landing-intro-skip" onClick={onSkip}>
        Skip intro
      </button>

      <div className="landing-intro-content">
        <PathWordmark />

        <motion.div
          className="landing-intro-buttons"
          initial="hidden"
          animate={buttonsVariant}
          variants={CTA_VARIANTS}
        >
          <button type="button" className="landing-intro-button primary" onClick={onWatchTutorial}>
            Watch Tutorial
          </button>
          <button type="button" className="landing-intro-button secondary" onClick={onPlanTrip}>
            Plan a Trip
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingIntro;
