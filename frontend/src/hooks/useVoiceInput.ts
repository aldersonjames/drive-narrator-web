import { useCallback, useMemo, useRef, useState } from 'react';

export type VoiceInputStatus = 'idle' | 'listening' | 'error';

export interface VoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

export interface VoiceInputController {
  status: VoiceInputStatus;
  transcript: string;
  error?: string;
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  isSupported: boolean;
}

type SpeechRecognitionConstructor = new () => SpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const getRecognition = (): SpeechRecognition | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognitionCtor ? new SpeechRecognitionCtor() : undefined;
};

export const useVoiceInput = (options: VoiceInputOptions = {}): VoiceInputController => {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | undefined>();

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current) {
      return recognitionRef.current;
    }
    const recognition = getRecognition();
    if (!recognition) {
      return undefined;
    }

    recognition.continuous = options.continuous ?? false;
    recognition.interimResults = options.interimResults ?? false;
    if (options.language) {
      recognition.lang = options.language;
    }

    recognition.onstart = () => setStatus('listening');
    recognition.onresult = (event) => {
      const latestResult = Array.from(event.results)
        .map((item) => item[0]?.transcript ?? '')
        .join(' ')
        .trim();
      setTranscript(latestResult);
    };
    recognition.onerror = (event) => {
      setError(event.error ?? 'Speech recognition error');
      setStatus('error');
    };
    recognition.onend = () => {
      setStatus('idle');
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [options.continuous, options.interimResults, options.language]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      setStatus('error');
      return;
    }
    const recognition = ensureRecognition();
    if (!recognition) {
      setError('Speech recognition unavailable');
      setStatus('error');
      return;
    }
    setError(undefined);
    recognition.start();
  }, [ensureRecognition, isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(undefined);
    setStatus('idle');
  }, []);

  return {
    status,
    transcript,
    error,
    startListening,
    stopListening,
    reset,
    isSupported,
  };
};
