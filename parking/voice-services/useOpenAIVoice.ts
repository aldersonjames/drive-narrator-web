import { useState, useEffect, useCallback, useRef } from 'react';
import OpenAIWebSocketService, { VoiceConfig, VoiceState, VoiceEventHandlers } from '../services/voice/openaiWebSocketService';

export interface UseOpenAIVoiceOptions {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  vadThreshold?: number;
  silenceDuration?: number;
  autoConnect?: boolean;
}

export interface UseOpenAIVoiceReturn {
  // State
  state: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  sendMessage: (message: string) => void;
  interrupt: () => void;
  
  // Data
  transcript: string;
  error: Error | null;
  
  // Utilities
  clearTranscript: () => void;
  clearError: () => void;
}

export function useOpenAIVoice(options: UseOpenAIVoiceOptions): UseOpenAIVoiceReturn {
  const [state, setState] = useState<VoiceState>({
    isConnected: false,
    isListening: false,
    isSpeaking: false,
    isProcessing: false
  });
  
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);
  
  const serviceRef = useRef<OpenAIWebSocketService | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize service
  useEffect(() => {
    if (!isInitializedRef.current) {
      const config: VoiceConfig = {
        apiKey: options.apiKey,
        model: options.model,
        voice: options.voice,
        instructions: options.instructions,
        vadThreshold: options.vadThreshold,
        silenceDuration: options.silenceDuration
      };

      const handlers: VoiceEventHandlers = {
        onStateChange: (newState) => {
          setState(newState);
        },
        onTranscript: (newTranscript) => {
          setTranscript(prev => prev + newTranscript + ' ');
        },
        onError: (err) => {
          setError(err);
        },
        onBargeIn: () => {
          console.log('Barge-in detected!');
        }
      };

      serviceRef.current = new OpenAIWebSocketService(config, handlers);
      isInitializedRef.current = true;

      // Auto-connect if enabled
      if (options.autoConnect) {
        serviceRef.current.connect().catch(err => setError(err));
      }
    }

    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
        serviceRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [options.apiKey, options.model, options.voice, options.instructions, options.vadThreshold, options.silenceDuration, options.autoConnect]);

  const connect = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    
    try {
      setError(null);
      await serviceRef.current.connect();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
    }
  }, []);

  const startListening = useCallback(async () => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    
    try {
      setError(null);
      await serviceRef.current.startListening();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.stopListening();
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }
    
    serviceRef.current.sendMessage(message);
  }, []);

  const interrupt = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.interrupt();
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    state,
    isConnected: state.isConnected,
    isListening: state.isListening,
    isSpeaking: state.isSpeaking,
    isProcessing: state.isProcessing,
    
    // Actions
    connect,
    disconnect,
    startListening,
    stopListening,
    sendMessage,
    interrupt,
    
    // Data
    transcript,
    error,
    
    // Utilities
    clearTranscript,
    clearError
  };
}

export default useOpenAIVoice;

