import React, { useState, useRef, useEffect } from 'react';
import { OPENAI_VOICES, PERSONALITY_PRESETS, ACCENT_OPTIONS, VOICE_CHARACTERISTICS, PERSONA_SAMPLE_TEXTS } from '../../data/voicePresets';
import useRealtimeVoice from '../../hooks/useRealtimeVoice';

interface CombinedPreviewProps {
  selectedVoiceId: string;
  selectedPersonaId: string;
  selectedAccentId: string;
  onSave: () => void;
  isSaving?: boolean;
}

export const CombinedPreview: React.FC<CombinedPreviewProps> = ({
  selectedVoiceId,
  selectedPersonaId,
  selectedAccentId,
  onSave,
  isSaving = false,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use Realtime Voice hook for preview
  const {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    sendText,
    startSpeaking,
    stopSpeaking,
    error
  } = useRealtimeVoice({
    voiceId: selectedVoiceId as 'alloy' | 'echo' | 'shimmer',
    personaId: selectedPersonaId,
    accentId: selectedAccentId,
    autoConnect: false
  });

  const selectedVoice = OPENAI_VOICES.find(voice => voice.id === selectedVoiceId);
  const selectedPersona = PERSONALITY_PRESETS.find(persona => persona.id === selectedPersonaId);
  const selectedAccent = ACCENT_OPTIONS.find(accent => accent.id === selectedAccentId);
  const voiceCharacteristics = VOICE_CHARACTERISTICS[selectedVoiceId];

  const handlePreview = async () => {
    if (!selectedVoice || !selectedPersona || !selectedAccent) return;

    setIsGenerating(true);
    setIsPlaying(false);

    try {
      // Connect to Realtime API if not already connected
      if (!isConnected) {
        await connect();
      }

      // Get the persona-specific sample text
      const personaSampleText = PERSONA_SAMPLE_TEXTS[selectedPersonaId] || PERSONA_SAMPLE_TEXTS['custom'];
      
      // Send text and start speaking
      sendText(personaSampleText);
      startSpeaking();
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle speaking state changes
  useEffect(() => {
    if (isSpeaking) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  }, [isSpeaking]);

  const handlePlayPause = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      startSpeaking();
      setIsPlaying(true);
    }
  };

  const canPreview = selectedVoice && selectedPersona && selectedAccent;
  const canSave = canPreview && !isGenerating && !isSaving;

  return (
    <div className="w-full">
      {/* Preview & Save Controls */}
      <div className="space-y-4">
        {/* Single Preview Button */}
        <button
          onClick={handlePreview}
          disabled={!canPreview || isGenerating}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200
            ${canPreview && !isGenerating
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isConnected ? 'Playing Preview...' : 'Connecting...'}
            </div>
          ) : (
            '🎵 Preview Voice'
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={!canSave}
          className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200
            ${canSave
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }
          `}
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            '💾 Save & Use This Voice'
          )}
        </button>
      </div>
    </div>
  );
};
