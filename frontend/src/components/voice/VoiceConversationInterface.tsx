import React, { useState, useEffect } from 'react';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import { useDrivePlanner } from '../../context/DrivePlannerContext';
import { DEFAULT_PERSONA_ID } from '../../../../shared/data/narratorPersonas';
import BreathingOrb from './BreathingOrb';

interface VoiceConversationInterfaceProps {
  className?: string;
  onCommand?: (command: unknown) => void;
}

export const VoiceConversationInterface: React.FC<VoiceConversationInterfaceProps> = ({
  className = '',
  onCommand,
}) => {
  const { preferences } = useDrivePlanner();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showFallbackInput, setShowFallbackInput] = useState(false);
  const [voiceFailureCount, setVoiceFailureCount] = useState(0);
  const textInputRef = React.useRef<HTMLInputElement>(null);

  const voiceConversation = useVoiceConversation({
    voiceSettings: {
      voiceId: preferences?.assistantVoiceId || 'alloy',
      personaId: preferences?.metadata?.narrationPersonaId || DEFAULT_PERSONA_ID,
    },
    context: {
      interests: preferences?.interestTags || [],
    },
    onCommand: (command) => {
      console.log('Voice command received:', command);
      onCommand?.(command);
    },
    onResponse: (response) => {
      console.log('Voice response:', response);
    },
    onError: (error) => {
      console.error('Voice conversation error:', error);
    },
    autoListen: true,
  });

  useEffect(() => {
    if (!isInitialized && voiceConversation.isSupported) {
      setIsInitialized(true);
      // Start conversation automatically
      voiceConversation.startConversation();
    }
  }, [isInitialized, voiceConversation]);

  // Auto-show fallback input on repeated voice failures
  useEffect(() => {
    if (voiceConversation.error && voiceFailureCount >= 2) {
      setShowFallbackInput(true);
      // Focus the text input for immediate typing
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }, [voiceConversation.error, voiceFailureCount]);

  // Track voice failures
  useEffect(() => {
    if (voiceConversation.error) {
      setVoiceFailureCount((prev) => prev + 1);
    } else if (voiceConversation.isListening) {
      // Reset failure count on successful voice activity
      setVoiceFailureCount(0);
    }
  }, [voiceConversation.error, voiceConversation.isListening]);

  const handleStartConversation = () => {
    voiceConversation.startConversation();
  };

  const handleStopConversation = () => {
    voiceConversation.stopConversation();
  };

  const handleSendMessage = (message: string) => {
    voiceConversation.sendMessage(message);
  };

  const getStatusColor = () => {
    if (voiceConversation.isSpeaking) return 'bg-green-500';
    if (voiceConversation.isListening) return 'bg-blue-500';
    if (voiceConversation.isProcessing) return 'bg-yellow-500';
    if (voiceConversation.isAwake) return 'bg-purple-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (voiceConversation.isSpeaking) return 'Speaking';
    if (voiceConversation.isListening) return 'Listening';
    if (voiceConversation.isProcessing) return 'Processing';
    if (voiceConversation.isAwake) return 'Awake';
    return 'Ready';
  };

  if (!voiceConversation.isSupported) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Voice Not Supported
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your browser doesn&apos;t support voice recognition. Please use a modern browser like
            Chrome or Edge.
          </p>
          <button
            onClick={handleStartConversation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Anyway
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      {/* Status Indicator */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>
        {voiceConversation.error && (
          <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg max-w-md mx-auto">
            <p className="text-sm text-red-600 dark:text-red-400">{voiceConversation.error}</p>
            {voiceFailureCount >= 2 && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                💡 Having trouble with voice? Try typing your message below instead.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Breathing Orb */}
      <div className="mb-8">
        <BreathingOrb
          isActive={voiceConversation.isActive}
          isListening={voiceConversation.isListening}
          isSpeaking={voiceConversation.isSpeaking}
          isProcessing={voiceConversation.isProcessing}
          size="large"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center space-y-4">
        {!voiceConversation.isActive ? (
          <button
            onClick={handleStartConversation}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Voice Conversation
          </button>
        ) : (
          <div className="flex space-x-4">
            <button
              onClick={handleStopConversation}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
            <button
              onClick={() => voiceConversation.pauseConversation()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Pause
            </button>
            <button
              onClick={() => voiceConversation.resumeConversation()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Resume
            </button>
          </div>
        )}

        {/* Manual Input */}
        <div
          className={`w-full max-w-md p-3 rounded-lg transition-all ${
            showFallbackInput
              ? 'bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-300 dark:border-blue-700'
              : ''
          }`}
        >
          {showFallbackInput && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              ✍️ Text mode active - Type your message below
            </p>
          )}
          <div className="flex space-x-2">
            <input
              ref={textInputRef}
              type="text"
              placeholder={showFallbackInput ? 'Type your message here...' : 'Type a message...'}
              className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-gray-800 dark:text-white transition-all ${
                showFallbackInput
                  ? 'border-blue-400 dark:border-blue-500 focus:ring-blue-600'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
              }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              onClick={() => {
                const input = textInputRef.current;
                if (input?.value) {
                  handleSendMessage(input.value);
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Transcript */}
      {voiceConversation.transcript && (
        <div className="mt-6 w-full max-w-md">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">You said:</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
            {voiceConversation.transcript}
          </p>
        </div>
      )}

      {/* Last Response */}
      {voiceConversation.lastResponse && (
        <div className="mt-4 w-full max-w-md">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Drive Narrator:
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            {voiceConversation.lastResponse}
          </p>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 w-full max-w-md">
          <details className="text-xs text-gray-500 dark:text-gray-400">
            <summary className="cursor-pointer">Debug Info</summary>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
              {JSON.stringify(voiceConversation.getStatus(), null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default VoiceConversationInterface;
