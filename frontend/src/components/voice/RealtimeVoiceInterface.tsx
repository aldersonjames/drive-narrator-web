import React, { useState, useEffect, useRef } from 'react';
import useRealtimeVoice from '../../hooks/useRealtimeVoice';
import { useDrivePlanner } from '../../context/DrivePlannerContext';

interface RealtimeVoiceInterfaceProps {
  className?: string;
}

export const RealtimeVoiceInterface: React.FC<RealtimeVoiceInterfaceProps> = ({
  className = ''
}) => {
  const { preferences } = useDrivePlanner();
  const [isListening, setIsListening] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Get voice settings from preferences
  const voiceId = preferences?.assistantVoiceId || 'alloy';
  const personaId = preferences?.narrationPersonaId || 'local-expert';
  const accentId = preferences?.narrationAccentId || 'american';

  const {
    isConnected,
    isSpeaking,
    isRecording,
    audioLevel,
    userTranscript,
    assistantTranscript,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    sendText,
    startSpeaking,
    stopSpeaking,
    error,
    clearError
  } = useRealtimeVoice({
    voiceId: voiceId as 'alloy' | 'echo' | 'shimmer',
    personaId,
    accentId,
    autoConnect: true
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
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, newMessage]);
    }
  }, [userTranscript]);

  // Handle assistant transcript updates
  useEffect(() => {
    if (assistantTranscript) {
      const newMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant' as const,
        content: assistantTranscript,
        timestamp: new Date()
      };
      setConversationHistory(prev => [...prev, newMessage]);
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
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getConnectionStatus()}
        </div>
      </div>

      {/* Conversation History */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationHistory.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-lg mb-2">👋 Welcome to Drive Narrator!</p>
            <p>Start a conversation by speaking or typing below.</p>
          </div>
        ) : (
          conversationHistory.map((message) => (
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
          ))
        )}
        <div ref={conversationEndRef} />
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

      {/* Voice Controls */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          {/* Voice Recording Button */}
          <button
            onClick={isRecording ? handleStopListening : handleStartListening}
            disabled={!isConnected}
            className={`
              flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200
              ${isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isRecording ? (
              <div className="w-6 h-6 bg-white rounded-sm" />
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>

          {/* Audio Level Indicator */}
          {isRecording && (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-4 rounded-full transition-colors duration-100 ${
                    audioLevel > i * 0.2 ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Text Input */}
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Type a message..."
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

        {/* Connection Status */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
          {isConnected ? (
            <span>Connected to OpenAI Realtime API</span>
          ) : (
            <span>Connecting to voice service...</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealtimeVoiceInterface;
