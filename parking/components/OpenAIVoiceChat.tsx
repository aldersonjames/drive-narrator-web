import React, { useState, useEffect } from 'react';
import useOpenAIVoice from '../../hooks/useOpenAIVoice';

interface OpenAIVoiceChatProps {
  apiKey: string;
  onClose?: () => void;
}

const OpenAIVoiceChat: React.FC<OpenAIVoiceChatProps> = ({ apiKey, onClose }) => {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  const {
    state,
    isConnected,
    isListening,
    isSpeaking,
    isProcessing,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendMessage,
    interrupt,
    transcript,
    error,
    clearTranscript,
    clearError
  } = useOpenAIVoice({
    apiKey,
    voice: 'alloy',
    instructions: 'You are a helpful travel assistant. Help users plan their trips and answer questions about destinations.',
    autoConnect: true
  });

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  const handleStartListening = async () => {
    try {
      await startListening();
    } catch (err) {
      console.error('Failed to start listening:', err);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = () => {
    if (error) return 'bg-red-100 text-red-800';
    if (isSpeaking) return 'bg-yellow-100 text-yellow-800';
    if (isListening) return 'bg-blue-100 text-blue-800';
    if (isProcessing) return 'bg-purple-100 text-purple-800';
    if (isConnected) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isSpeaking) return 'AI Speaking';
    if (isListening) return 'Listening';
    if (isProcessing) return 'Processing';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">OpenAI Voice Chat</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            {onClose && (
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error.message}</p>
                  <button
                    onClick={clearError}
                    className="mt-1 text-xs text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transcript Display */}
          {transcript && (
            <div className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Transcript</h3>
                <button
                  onClick={clearTranscript}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <p className="text-sm text-gray-600">{transcript}</p>
            </div>
          )}

          {/* Controls */}
          <div className="space-y-3">
            {/* Connection Controls */}
            <div className="flex space-x-2">
              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnected}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
              ) : (
                <button
                  onClick={disconnect}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Disconnect
                </button>
              )}
            </div>

            {/* Voice Controls */}
            {isConnected && (
              <div className="flex space-x-2">
                {!isListening ? (
                  <button
                    onClick={handleStartListening}
                    disabled={isListening}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start Listening
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                  >
                    Stop Listening
                  </button>
                )}
                
                {isSpeaking && (
                  <button
                    onClick={interrupt}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Interrupt
                  </button>
                )}
              </div>
            )}

            {/* Text Input */}
            <div className="space-y-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={!isConnected}
              />
              <button
                onClick={handleSendMessage}
                disabled={!isConnected || !message.trim()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Message
              </button>
            </div>
          </div>

          {/* State Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-md p-3 text-xs">
              <h4 className="font-medium mb-2">Debug Info:</h4>
              <pre className="text-gray-600">
                {JSON.stringify(state, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpenAIVoiceChat;

