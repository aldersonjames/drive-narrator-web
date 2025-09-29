import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  ConversationReplyPayload,
  ConversationTurn,
  RouteSummary,
} from '../../../shared/types/tripNarrator';
import { VoiceOutputService } from '../services/voice/voiceOutputService';
import { useVoiceInput } from './useVoiceInput';
import type { BreathingOrbState } from '../components/voice/BreathingOrb';

const getApiBase = (): string =>
  (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_BASE_URL : undefined) ??
  (typeof process !== 'undefined' ? process.env?.REACT_APP_API_BASE_URL : undefined) ??
  '/api';

const createId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

type UseVoiceConversationOptions = {
  route?: RouteSummary;
  interestTags?: string[];
  profileId?: string;
};

export interface VoiceConversationController {
  orbState: BreathingOrbState;
  transcript: string;
  conversation: ConversationTurn[];
  suggestions: string[];
  isProcessing: boolean;
  error?: string;
  startVoice: () => void;
  stopVoice: () => void;
  sendText: (text: string) => Promise<void>;
  reset: () => void;
}

export const useVoiceConversation = (
  options: UseVoiceConversationOptions = {},
): VoiceConversationController => {
  const apiBase = useMemo(() => getApiBase(), []);
  const voiceInput = useVoiceInput({ continuous: false, interimResults: true });
  const [orbState, setOrbState] = useState<BreathingOrbState>('idle');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessing, setProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const capturePendingRef = useRef(false);
  const voiceOutputRef = useRef(
    new VoiceOutputService({
      onStart: () => setOrbState('speaking'),
      onEnd: () => setOrbState('idle'),
      onError: (_segment, err) => {
        setError(err.message);
        setOrbState('error');
      },
    }),
  );

  const appendTurn = useCallback((turn: ConversationTurn) => {
    setConversation((prev) => [...prev, turn]);
  }, []);

  const sendText = useCallback(
    async (raw: string): Promise<void> => {
      const text = raw.trim();
      if (!text || isProcessing) {
        return;
      }

      const now = new Date().toISOString();
      const travelerTurn: ConversationTurn = {
        id: createId(),
        role: 'traveler',
        text,
        createdAt: now,
      };

      appendTurn(travelerTurn);
      setProcessing(true);
      setError(undefined);

      try {
        const response = await fetch(`${apiBase}/conversation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-traveler-id': options.profileId ?? 'traveler-001',
          },
          body: JSON.stringify({
            message: text,
            routeId: options.route?.routeId,
            routeName: options.route ? `Route ${options.route.routeId}` : undefined,
            interestTags: options.interestTags ?? [],
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || 'Conversation request failed');
        }

        const payload = (await response.json()) as ConversationReplyPayload;

        appendTurn(payload.turn);
        setSuggestions(payload.followUps);

        if (payload.audioSegments.length) {
          for (const segment of payload.audioSegments) {
            await voiceOutputRef.current.speak({
              id: segment.id,
              text: segment.text,
              voiceId: segment.voiceId,
            });
          }
        } else {
          setOrbState('idle');
        }
      } catch (err) {
        setError((err as Error).message);
        setOrbState('error');
      } finally {
        setProcessing(false);
        voiceInput.reset();
      }
    },
    [
      apiBase,
      appendTurn,
      isProcessing,
      options.interestTags,
      options.profileId,
      options.route,
      voiceInput,
    ],
  );

  const startVoice = useCallback(() => {
    if (isProcessing) return;
    capturePendingRef.current = true;
    setOrbState('listening');
    setError(undefined);
    voiceInput.reset();
    voiceInput.startListening();
  }, [isProcessing, voiceInput]);

  const stopVoice = useCallback(() => {
    capturePendingRef.current = false;
    voiceInput.stopListening();
    if (!isProcessing) {
      setOrbState('idle');
    }
  }, [isProcessing, voiceInput]);

  const reset = useCallback(() => {
    capturePendingRef.current = false;
    setConversation([]);
    setSuggestions([]);
    setError(undefined);
    setOrbState('idle');
    voiceInput.reset();
    voiceOutputRef.current.stop();
  }, [voiceInput]);

  useEffect(() => {
    if (voiceInput.status === 'error') {
      setError(voiceInput.error ?? 'Speech recognition error');
      setOrbState('error');
      capturePendingRef.current = false;
    }
  }, [voiceInput.error, voiceInput.status]);

  useEffect(() => {
    if (!capturePendingRef.current) {
      return;
    }

    if (voiceInput.status === 'idle') {
      capturePendingRef.current = false;
      const text = voiceInput.transcript.trim();
      if (text) {
        void sendText(text);
      } else {
        setOrbState('idle');
      }
    } else if (voiceInput.status === 'listening') {
      setOrbState('listening');
    }
  }, [sendText, voiceInput.status, voiceInput.transcript]);

  const transcript = voiceInput.status === 'listening' ? voiceInput.transcript : '';

  return {
    orbState,
    transcript,
    conversation,
    suggestions,
    isProcessing,
    error,
    startVoice,
    stopVoice,
    sendText,
    reset,
  };
};
