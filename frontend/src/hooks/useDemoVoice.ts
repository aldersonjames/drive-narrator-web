import { useEffect, useMemo, useState } from 'react';

import { suggestionPhrases } from '../mock/demoData';
import type { OrbPhase } from '../components/voice/BreathingOrb';

export interface DemoVoiceState {
  phase: OrbPhase;
  transcript: string;
  suggestions: string[];
  isRibbonVisible: boolean;
  acknowledge: () => void;
}

const demoSamples = [
  'Find routes with historic sites',
  'Tell me about scenic photo spots',
  'Add a coffee detour in the next hour',
];

export const useDemoVoice = (): DemoVoiceState => {
  const [phase, setPhase] = useState<OrbPhase>('listening');
  const [transcript, setTranscript] = useState<string>('');
  const [ribbonVisible, setRibbonVisible] = useState<boolean>(false);

  useEffect(() => {
    let timeout = window.setTimeout(() => {
      setPhase('processing');
      setTranscript(demoSamples[0]);
      setRibbonVisible(true);
      timeout = window.setTimeout(() => {
        setPhase('speaking');
        timeout = window.setTimeout(() => {
          setPhase('idle');
        }, 2600);
      }, 1400);
    }, 2400);
    return () => window.clearTimeout(timeout);
  }, []);

  const suggestions = useMemo(() => suggestionPhrases, []);

  const acknowledge = () => setRibbonVisible(false);

  return {
    phase,
    transcript,
    suggestions,
    isRibbonVisible: ribbonVisible,
    acknowledge,
  };
};
