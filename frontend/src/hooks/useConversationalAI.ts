import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceCommand } from './useVoiceCommands';
import { conversationMemory } from '../services/conversationMemory';

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    command?: VoiceCommand;
    confidence?: number;
    processingTime?: number;
  };
}

export interface ConversationContext {
  driveId?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  interests?: string[];
  currentPoi?: {
    id: string;
    name: string;
    distance: number;
    eta: number;
  };
  recentCommands?: VoiceCommand[];
}

interface ConversationalAIOptions {
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
  context?: ConversationContext;
  voiceSettings?: {
    voiceId: string;
    personaId: string;
  };
}

export const useConversationalAI = (options: ConversationalAIOptions = {}) => {
  const { onResponse, onError, context, voiceSettings } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [lastResponse, setLastResponse] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionStartedRef = useRef(false);

  // Start conversation session on mount
  useEffect(() => {
    if (!sessionStartedRef.current) {
      const session = conversationMemory.getCurrentSession();
      if (!session) {
        conversationMemory.startSession(context);
      }
      // Load existing turns from current session
      const turns = conversationMemory.getRecentTurns(20);
      if (turns.length > 0) {
        setConversationHistory(turns);
      }
      sessionStartedRef.current = true;
    }

    // End session on unmount
    return () => {
      if (sessionStartedRef.current) {
        conversationMemory.endSession();
        sessionStartedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processCommand = useCallback(
    async (command: VoiceCommand) => {
      if (isProcessing) return;

      setIsProcessing(true);

      // Add user command to conversation history and memory
      const userTurn = conversationMemory.addTurn({
        role: 'user',
        content: command.originalText,
        metadata: {
          command,
          confidence: command.confidence,
          intent: command.intent,
        },
      });

      setConversationHistory((prev) => [...prev, userTurn]);

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Include the new turn explicitly to avoid async state issues
        const history = [...conversationHistory.slice(-9), userTurn];

        const response = await fetch('/api/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: command.originalText,
            command: command,
            context: context,
            conversationHistory: history, // Last 10 turns including the new one
            voiceSettings: voiceSettings,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Add assistant response to conversation history and memory
        const assistantTurn = conversationMemory.addTurn({
          role: 'assistant',
          content: data.text,
          metadata: {
            processingTime: data.processingTime,
          },
        });

        setConversationHistory((prev) => [...prev, assistantTurn]);
        setLastResponse(data.text);
        onResponse?.(data.text);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't show error
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        onError?.(errorMessage);
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [isProcessing, context, conversationHistory, voiceSettings, onResponse, onError],
  );

  const processMessage = useCallback(
    async (message: string) => {
      if (isProcessing) return;

      setIsProcessing(true);

      // Add user message to conversation history and memory
      const userTurn = conversationMemory.addTurn({
        role: 'user',
        content: message,
      });

      setConversationHistory((prev) => [...prev, userTurn]);

      try {
        // Create abort controller for this request
        abortControllerRef.current = new AbortController();

        // Include the new turn explicitly to avoid async state issues
        const history = [...conversationHistory.slice(-9), userTurn];

        const response = await fetch('/api/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            context: context,
            conversationHistory: history, // Last 10 turns including the new one
            voiceSettings: voiceSettings,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Add assistant response to conversation history and memory
        const assistantTurn = conversationMemory.addTurn({
          role: 'assistant',
          content: data.text,
          metadata: {
            processingTime: data.processingTime,
          },
        });

        setConversationHistory((prev) => [...prev, assistantTurn]);
        setLastResponse(data.text);
        onResponse?.(data.text);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was aborted, don't show error
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        onError?.(errorMessage);
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [isProcessing, context, conversationHistory, voiceSettings, onResponse, onError],
  );

  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse('');
    conversationMemory.clearAll();
  }, []);

  const getConversationSummary = useCallback(() => {
    return {
      totalTurns: conversationHistory.length,
      userTurns: conversationHistory.filter((turn) => turn.role === 'user').length,
      assistantTurns: conversationHistory.filter((turn) => turn.role === 'assistant').length,
      lastActivity: conversationHistory[conversationHistory.length - 1]?.timestamp,
    };
  }, [conversationHistory]);

  const getUserLearning = useCallback(() => {
    return conversationMemory.getUserPreferences();
  }, []);

  const getAdaptedContext = useCallback((baseInstructions: string) => {
    return conversationMemory.getAdaptedInstructions(baseInstructions);
  }, []);

  const searchConversationHistory = useCallback((query: string) => {
    return conversationMemory.searchHistory(query);
  }, []);

  return {
    isProcessing,
    conversationHistory,
    lastResponse,
    processCommand,
    processMessage,
    abortRequest,
    clearHistory,
    getConversationSummary,
    getUserLearning,
    getAdaptedContext,
    searchConversationHistory,
  };
};
