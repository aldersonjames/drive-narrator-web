import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type VoiceInputStatus = 'idle' | 'listening' | 'error';

export interface VoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onTranscript?: (details: {
    transcript: string;
    isFinal: boolean;
    event: SpeechRecognitionEvent;
  }) => void;
  onStatusChange?: (status: VoiceInputStatus) => void;
  onError?: (message: string, event?: SpeechRecognitionErrorEvent | DOMException) => void;
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
  const optionsRef = useRef(options);
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const updateStatus = useCallback((next: VoiceInputStatus) => {
    setStatus(next);
    optionsRef.current.onStatusChange?.(next);
  }, []);

  const emitTranscript = useCallback(
    (details: { transcript: string; isFinal: boolean; event: SpeechRecognitionEvent }) => {
      optionsRef.current.onTranscript?.(details);
    },
    [],
  );

  const emitError = useCallback(
    (message: string, evt?: SpeechRecognitionErrorEvent | DOMException) => {
      setError(message);
      updateStatus('error');
      optionsRef.current.onError?.(message, evt);
    },
    [updateStatus],
  );

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

    recognition.onstart = () => {
      setError(undefined);
      updateStatus('listening');
    };
    recognition.onresult = (event) => {
      const results = Array.from(event.results ?? []);
      const latestResult = results
        .map((item) => item[0]?.transcript ?? '')
        .join(' ')
        .trim();
      setTranscript(latestResult);

      const latest = results[results.length - 1];
      const isFinal = Boolean(latest?.isFinal);
      emitTranscript({ transcript: latestResult, isFinal, event });

      if (isFinal && !(optionsRef.current.continuous ?? false)) {
        recognition.stop();
      }
    };
    recognition.onerror = (event) => {
      const code = event.error;
      const message =
        code === 'not-allowed' || code === 'service-not-allowed'
          ? 'Microphone permission denied'
          : code === 'no-speech'
            ? 'No speech detected. Try again.'
            : event.message || 'Speech recognition error';
      emitError(message, event);
    };
    recognition.onend = () => {
      updateStatus('idle');
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [
    emitError,
    emitTranscript,
    options.continuous,
    options.interimResults,
    options.language,
    updateStatus,
  ]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      emitError('Speech recognition not supported');
      return;
    }
    const recognition = ensureRecognition();
    if (!recognition) {
      emitError('Speech recognition unavailable');
      return;
    }
    setError(undefined);
    try {
      recognition.start();
    } catch (err) {
      const domError = err as DOMException | undefined;
      if (domError?.name === 'NotAllowedError') {
        emitError('Microphone permission denied', domError);
        return;
      }
      emitError(domError?.message || 'Unable to start speech recognition', domError);
    }
  }, [emitError, ensureRecognition, isSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setError(undefined);
    updateStatus('idle');
  }, [updateStatus]);

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current as
        | (SpeechRecognition & { abort?: () => void })
        | null;
      recognition?.abort?.();
      recognitionRef.current = null;
    };
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
