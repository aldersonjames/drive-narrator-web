import { useState, useCallback, useRef } from 'react';
import { VoiceCommand } from './useVoiceCommands';

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
    accentId: string;
  };
}

export const useConversationalAI = (options: ConversationalAIOptions = {}) => {
  const {
    onResponse,
    onError,
    context,
    voiceSettings,
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [lastResponse, setLastResponse] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const processCommand = useCallback(async (command: VoiceCommand) => {
    if (isProcessing) return;

    setIsProcessing(true);
    
    // Add user command to conversation history
    const userTurn: ConversationTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: command.originalText,
      timestamp: new Date(),
      metadata: {
        command,
        confidence: command.confidence,
      },
    };

    setConversationHistory(prev => [...prev, userTurn]);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: command.originalText,
          command: command,
          context: context,
          conversationHistory: conversationHistory.slice(-10), // Last 10 turns
          voiceSettings: voiceSettings,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response to conversation history
      const assistantTurn: ConversationTurn = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
        metadata: {
          processingTime: data.processingTime,
        },
      };

      setConversationHistory(prev => [...prev, assistantTurn]);
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
  }, [isProcessing, context, conversationHistory, voiceSettings, onResponse, onError]);

  const processMessage = useCallback(async (message: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    // Add user message to conversation history
    const userTurn: ConversationTurn = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setConversationHistory(prev => [...prev, userTurn]);

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: context,
          conversationHistory: conversationHistory.slice(-10), // Last 10 turns
          voiceSettings: voiceSettings,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response to conversation history
      const assistantTurn: ConversationTurn = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date(),
        metadata: {
          processingTime: data.processingTime,
        },
      };

      setConversationHistory(prev => [...prev, assistantTurn]);
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
  }, [isProcessing, context, conversationHistory, voiceSettings, onResponse, onError]);

  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
    setLastResponse('');
  }, []);

  const getConversationSummary = useCallback(() => {
    return {
      totalTurns: conversationHistory.length,
      userTurns: conversationHistory.filter(turn => turn.role === 'user').length,
      assistantTurns: conversationHistory.filter(turn => turn.role === 'assistant').length,
      lastActivity: conversationHistory[conversationHistory.length - 1]?.timestamp,
    };
  }, [conversationHistory]);

  return {
    isProcessing,
    conversationHistory,
    lastResponse,
    processCommand,
    processMessage,
    abortRequest,
    clearHistory,
    getConversationSummary,
  };
};
