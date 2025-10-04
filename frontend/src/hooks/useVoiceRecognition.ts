import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onResult?: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export const useVoiceRecognition = (options: VoiceRecognitionOptions = {}) => {
  const {
    continuous = true,
    interimResults = true,
    language = 'en-US',
    onResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [state, setState] = useState<VoiceRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    confidence: 0,
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setState(prev => ({
      ...prev,
      isSupported: !!SpeechRecognition,
      error: SpeechRecognition ? null : 'Speech recognition not supported',
    }));
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!state.isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;

    recognition.onstart = () => {
      setState(prev => ({
        ...prev,
        isListening: true,
        error: null,
      }));
      onStart?.();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }

        maxConfidence = Math.max(maxConfidence, confidence);
      }

      const currentTranscript = finalTranscript || interimTranscript;
      
      setState(prev => ({
        ...prev,
        transcript: currentTranscript,
        confidence: maxConfidence,
      }));

      onResult?.(currentTranscript, maxConfidence);
    };

    recognition.onerror = (event) => {
      const errorMessage = getErrorMessage(event.error);
      setState(prev => ({
        ...prev,
        isListening: false,
        error: errorMessage,
      }));
      onError?.(errorMessage);
    };

    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
      }));
      onEnd?.();
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state.isSupported, continuous, interimResults, language, onResult, onError, onStart, onEnd]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || state.isListening) return;

    try {
      recognitionRef.current.start();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start voice recognition',
      }));
    }
  }, [state.isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !state.isListening) return;

    try {
      recognitionRef.current.stop();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to stop voice recognition',
      }));
    }
  }, [state.isListening]);

  const clearTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      confidence: 0,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      isListening: false,
      transcript: '',
      confidence: 0,
      error: null,
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    clearTranscript,
    reset,
  };
};

// Helper function to get user-friendly error messages
const getErrorMessage = (error: string): string => {
  switch (error) {
    case 'no-speech':
      return 'No speech was detected. Please try again.';
    case 'audio-capture':
      return 'No microphone was found. Please check your microphone.';
    case 'not-allowed':
      return 'Permission to use microphone was denied.';
    case 'network':
      return 'Network error occurred. Please check your connection.';
    case 'aborted':
      return 'Voice recognition was aborted.';
    case 'language-not-supported':
      return 'Language not supported.';
    default:
      return `Voice recognition error: ${error}`;
  }
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
