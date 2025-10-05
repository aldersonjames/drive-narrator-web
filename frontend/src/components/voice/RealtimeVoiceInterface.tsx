import React, { useState, useEffect, useRef } from 'react';
import useRealtimeVoice from '../../hooks/useRealtimeVoice';
import { useDrivePlanner } from '../../context/DrivePlannerContext';
import { DEFAULT_PERSONA_ID } from '../../../../shared/data/narratorPersonas';
import BreathingOrb from './BreathingOrb';

interface RealtimeVoiceInterfaceProps {
  className?: string;
}

export const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({
  className = '',
}) => {
  const { preferences } = useDrivePlanner();
  const [conversationHistory, setConversationHistory] = useState<
    Array<{
      id: string;
      type: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [voiceFailureCount, setVoiceFailureCount] = useState(0);

  const conversationEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Get voice settings from preferences
  const voiceId = preferences?.assistantVoiceId || 'alloy';
  const personaId = preferences?.metadata?.narrationPersonaId || DEFAULT_PERSONA_ID;

  const {
    isConnected,
    isSpeaking,
    isRecording,
    audioLevel,
    userTranscript,
    assistantTranscript,
    connect,
    startRecording,
    stopRecording,
    sendText,
    error,
    clearError,
  } = useRealtimeVoice({
    voiceId: voiceId as 'alloy' | 'echo' | 'shimmer',
    personaId,
    autoConnect: true,
  });

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  // Handle user transcript updates
  useEffect(() => {
    if (userTranscript) {
      const newMessage = {
        id: `user-${Date.now()}`,
        type: 'user' as const,
        content: userTranscript,
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, newMessage]);
    }
  }, [userTranscript]);

  // Handle assistant transcript updates
  useEffect(() => {
    if (assistantTranscript) {
      const newMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant' as const,
        content: assistantTranscript,
        timestamp: new Date(),
      };
      setConversationHistory((prev) => [...prev, newMessage]);
    }
  }, [assistantTranscript]);

  // Auto-show fallback input on repeated voice failures
  useEffect(() => {
    if (error && voiceFailureCount >= 2) {
      setShowFallbackInput(true);
      // Focus the text input for immediate typing
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [error, voiceFailureCount]);

  // Track voice failures
  useEffect(() => {
    if (error) {
      setVoiceFailureCount((prev) => prev + 1);
    } else if (isConnected && isRecording) {
      // Reset failure count on successful voice activity
      setVoiceFailureCount(0);
    }
  }, [error, isConnected, isRecording]);

  const handleStartListening = () => {
    if (!isConnected) {
      connect();
      return;
    }

    startRecording();
  };

  const handleStopListening = () => {
    stopRecording();
  };

  const handleSendText = (text: string) => {
    if (text.trim() && isConnected) {
      sendText(text.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = e.currentTarget;
      handleSendText(input.value);
      input.value = '';
    }
  };

  const getConnectionStatus = () => {
    if (!isConnected) return 'Disconnected';
    if (isSpeaking) return 'Speaking';
    if (isRecording) return 'Listening';
    return 'Ready';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'text-red-500';
    if (isSpeaking) return 'text-blue-500';
    if (isRecording) return 'text-green-500';
    return 'text-gray-500';
  };

  const getOrbPhase = () => {
    if (!isConnected) return 'error';
    if (isSpeaking) return 'speaking';
    if (isRecording) return 'listening';
    return 'idle';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Voice Conversation
          </h2>
        </div>
        <div className={`text-sm font-medium ${getStatusColor()}`}>{getConnectionStatus()}</div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Breathing Orb */}
        <div className="mb-8">
          <BreathingOrb
            phase={getOrbPhase()}
            disabled={!isConnected}
            onStartListening={handleStartListening}
            onStop={handleStopListening}
            messages={{
              idle: isConnected ? 'Ready to listen' : 'Connecting...',
              listening: 'Listening…',
              speaking: 'Speaking…',
              error: error || 'Connection error',
            }}
            amplitude={audioLevel}
            className="w-32 h-32"
          />
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isConnected ? 'Drive Narrator' : 'Connecting...'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected
              ? 'Tap the orb to start talking or type below'
              : 'Please wait while we connect to the voice service'}
          </p>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="w-full max-w-2xl overflow-y-auto max-h-64 space-y-4 mb-6">
            {conversationHistory.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            <div ref={conversationEndRef} />
          </div>
        )}
      </div>

      {/* Error Display with Fallback Suggestion */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
          {voiceFailureCount >= 2 && (
            <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
              💡 Having trouble with voice? Try typing your message below instead.
            </p>
          )}
        </div>
      )}

      {/* Text Input Controls */}
      <div
        className={`p-4 border-t border-gray-200 dark:border-gray-700 ${
          showFallbackInput
            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700'
            : ''
        }`}
      >
        {showFallbackInput && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            ✍️ Text mode active - Type your message below
          </p>
        )}
        <div className="flex gap-2">
          <input
            ref={textInputRef}
            type="text"
            placeholder={showFallbackInput ? 'Type your message here...' : 'Or type a message...'}
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className={`flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 disabled:opacity-50 transition-all ${
              showFallbackInput
                ? 'border-blue-400 dark:border-blue-500 focus:ring-blue-600'
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            }`}
          />
          <button
            onClick={() => {
              const input = textInputRef.current;
              if (input?.value) {
                handleSendText(input.value);
                input.value = '';
              }
            }}
            disabled={!isConnected}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        {showFallbackInput && (
          <button
            onClick={() => {
              setShowFallbackInput(false);
              setVoiceFailureCount(0);
            }}
            className="mt-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 underline"
          >
            Switch back to voice mode
          </button>
        )}
      </div>
    </div>
  );
};

export default RealtimeVoiceInterface;
