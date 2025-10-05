import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_PERSONA_ID } from '../../../shared/data/narratorPersonas';
import { useVoiceRecognition } from './useVoiceRecognition';
import { useVoiceCommands, VoiceCommand } from './useVoiceCommands';
import { useConversationalAI, ConversationContext } from './useConversationalAI';
import { useVoiceResponse, VoiceResponseOptions } from './useVoiceResponse';

export interface VoiceConversationOptions {
  context?: ConversationContext;
  voiceSettings?: {
    voiceId: string;
    personaId: string;
    accentId: string;
  };
  onCommand?: (command: VoiceCommand) => void;
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
  autoListen?: boolean;
  wakeWords?: string[];
}

export const useVoiceConversation = (options: VoiceConversationOptions = {}) => {
  const {
    context,
    voiceSettings = { voiceId: 'alloy', personaId: DEFAULT_PERSONA_ID, accentId: 'american' },
    onCommand,
    onResponse,
    onError,
    autoListen = false,
    wakeWords = ['hey drive narrator', 'drive narrator', 'narrate my drive'],
  } = options;

  const [isActive, setIsActive] = useState(false);
  const [isAwake, setIsAwake] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Voice recognition
  const voiceRecognition = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    onResult: (transcript, confidence) => {
      setLastActivity(new Date());
      voiceCommands.processTranscript(transcript, confidence);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  // Voice commands
  const voiceCommands = useVoiceCommands({
    onCommand: (command) => {
      setLastActivity(new Date());
      onCommand?.(command);
      conversationalAI.processCommand(command);
    },
    onError: (error) => {
      onError?.(error);
    },
    wakeWords,
  });

  // Conversational AI
  const conversationalAI = useConversationalAI({
    context,
    voiceSettings,
    onResponse: (response) => {
      setLastActivity(new Date());
      onResponse?.(response);
      voiceResponse.speak(response);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  // Voice response
  const voiceResponseOptions: VoiceResponseOptions = {
    ...voiceSettings,
    onStart: () => {
      setIsAwake(true);
    },
    onEnd: () => {
      setIsAwake(false);
    },
    onError: (error) => {
      onError?.(error);
    },
  };

  const voiceResponse = useVoiceResponse(voiceResponseOptions);

  // Auto-listen functionality
  useEffect(() => {
    if (autoListen && isActive) {
      voiceRecognition.startListening();
    } else if (!autoListen) {
      voiceRecognition.stopListening();
    }
  }, [autoListen, isActive, voiceRecognition]);

  // Wake word detection
  useEffect(() => {
    setIsAwake(voiceCommands.isAwake);
  }, [voiceCommands.isAwake]);

  const startConversation = useCallback(() => {
    setIsActive(true);
    voiceRecognition.startListening();
    setLastActivity(new Date());
  }, [voiceRecognition]);

  const stopConversation = useCallback(() => {
    setIsActive(false);
    voiceRecognition.stopListening();
    voiceResponse.stop();
    voiceCommands.sleep();
  }, [voiceRecognition, voiceResponse, voiceCommands]);

  const pauseConversation = useCallback(() => {
    voiceRecognition.stopListening();
    voiceResponse.pause();
  }, [voiceRecognition, voiceResponse]);

  const resumeConversation = useCallback(() => {
    if (isActive) {
      voiceRecognition.startListening();
      voiceResponse.resume();
    }
  }, [isActive, voiceRecognition, voiceResponse]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!isActive) return;

      setLastActivity(new Date());
      conversationalAI.processMessage(message);
    },
    [isActive, conversationalAI],
  );

  const clearHistory = useCallback(() => {
    conversationalAI.clearHistory();
    voiceCommands.clearLastCommand();
    voiceRecognition.clearTranscript();
  }, [conversationalAI, voiceCommands, voiceRecognition]);

  const getStatus = useCallback(() => {
    return {
      isActive,
      isAwake,
      isListening: voiceRecognition.isListening,
      isSpeaking: voiceResponse.isSpeaking,
      isProcessing: conversationalAI.isProcessing,
      lastActivity,
      conversationLength: conversationalAI.conversationHistory.length,
      queueLength: voiceResponse.getQueueLength(),
    };
  }, [
    isActive,
    isAwake,
    voiceRecognition.isListening,
    voiceResponse,
    conversationalAI.isProcessing,
    conversationalAI.conversationHistory.length,
    lastActivity,
  ]);

  const getConversationSummary = useCallback(() => {
    return conversationalAI.getConversationSummary();
  }, [conversationalAI]);

  return {
    // State
    isActive,
    isAwake,
    isListening: voiceRecognition.isListening,
    isSpeaking: voiceResponse.isSpeaking,
    isProcessing: conversationalAI.isProcessing,
    transcript: voiceRecognition.transcript,
    lastCommand: voiceCommands.lastCommand,
    lastResponse: conversationalAI.lastResponse,
    conversationHistory: conversationalAI.conversationHistory,
    lastActivity,

    // Controls
    startConversation,
    stopConversation,
    pauseConversation,
    resumeConversation,
    sendMessage,
    clearHistory,

    // Voice recognition
    startListening: voiceRecognition.startListening,
    stopListening: voiceRecognition.stopListening,
    clearTranscript: voiceRecognition.clearTranscript,

    // Voice response
    speak: voiceResponse.speak,
    stopSpeaking: voiceResponse.stop,
    pauseSpeaking: voiceResponse.pause,
    resumeSpeaking: voiceResponse.resume,

    // Commands
    wakeUp: voiceCommands.wakeUp,
    sleep: voiceCommands.sleep,

    // Utils
    getStatus,
    getConversationSummary,
    isSupported: voiceRecognition.isSupported,
    error: voiceRecognition.error,
  };
};
