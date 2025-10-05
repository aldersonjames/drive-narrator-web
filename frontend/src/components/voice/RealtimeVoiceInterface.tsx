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

  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Get voice settings from preferences
  const voiceId = preferences?.assistantVoiceId || 'alloy';
  const personaId = preferences?.narrationPersonaId || DEFAULT_PERSONA_ID;
  const accentId = preferences?.narrationAccentId || 'american';

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
    accentId,
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

  const handleStartListening = () => {
    if (!isConnected) {
      connect();
      return;
    }

    startRecording();
    setIsListening(true);
  };

  const handleStopListening = () => {
    stopRecording();
    setIsListening(false);
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

      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Text Input Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Or type a message..."
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
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
      </div>
    </div>
  );
};

export default RealtimeVoiceInterface;
