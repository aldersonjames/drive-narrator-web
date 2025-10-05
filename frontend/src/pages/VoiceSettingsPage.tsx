import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrivePlanner } from '../context/DrivePlannerContext';
import { VoiceCarousel } from '../components/voice/VoiceCarousel';
import { PersonaCarousel } from '../components/voice/PersonaCarousel';
import { CombinedPreview } from '../components/voice/CombinedPreview';
import { DEFAULT_PERSONA_ID } from '../../../shared/data/narratorPersonas';

const DEFAULT_PROFILE_ID = 'traveler-001';

export const VoiceSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, loadPreferences, updatePreferences } = useDrivePlanner();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('alloy');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(DEFAULT_PERSONA_ID);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const profileId = preferences?.profileId ?? DEFAULT_PROFILE_ID;

  // Load user preferences
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadPreferences(profileId);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, [loadPreferences, profileId]);

  // Set selected voice and persona from preferences
  useEffect(() => {
    if (preferences) {
      // Use narrationVoiceId if available, otherwise assistantVoiceId, otherwise default
      const savedVoiceId = preferences.narrationVoiceId || preferences.assistantVoiceId;
      if (savedVoiceId) {
        setSelectedVoiceId(savedVoiceId);
      }

      // Load saved persona
      const savedPersonaId = preferences.metadata?.narrationPersonaId;
      if (savedPersonaId) {
        setSelectedPersonaId(savedPersonaId);
      }
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      await updatePreferences(profileId, {
        assistantVoiceId: selectedVoiceId,
        narrationVoiceId: selectedVoiceId,
        metadata: {
          ...preferences?.metadata,
          narrationPersonaId: selectedPersonaId,
        },
      });

      setSaveMessage('Voice settings saved successfully!');
      setTimeout(() => {
        navigate('/settings');
      }, 1500);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveMessage('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading voice settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Voice Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Choose your drive narrator&apos;s voice and personality
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* Voice Selection Carousel */}
        <VoiceCarousel selectedVoiceId={selectedVoiceId} onVoiceSelect={setSelectedVoiceId} />

        {/* Persona Selection Carousel */}
        <PersonaCarousel
          selectedPersonaId={selectedPersonaId}
          onPersonaSelect={setSelectedPersonaId}
        />

        {/* Combined Preview & Save */}
        <CombinedPreview
          selectedVoiceId={selectedVoiceId}
          selectedPersonaId={selectedPersonaId}
          onSave={handleSave}
          isSaving={isSaving}
        />

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`text-center text-sm ${
              saveMessage.includes('success')
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceSettingsPage;
