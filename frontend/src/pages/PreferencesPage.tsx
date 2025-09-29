import React, { useMemo, useState } from 'react';

import { useTripPlanner } from '../context/TripPlannerContext';
import BreathingOrb from '../components/voice/BreathingOrb';

const VOICES = [
  { voiceId: 'assistant-default', displayName: 'Assistant Default' },
  { voiceId: 'assistant-calm', displayName: 'Assistant Calm' },
  { voiceId: 'assistant-serene', displayName: 'Assistant Serene' },
  { voiceId: 'narrator-default', displayName: 'Narrator Default' },
  { voiceId: 'narrator-story', displayName: 'Narrator Story' },
  { voiceId: 'narrator-storyteller', displayName: 'Narrator Storyteller' },
];

export const PreferencesPage: React.FC = () => {
  const { preferences, updatePreferences } = useTripPlanner();
  const [assistantVoiceId, setAssistantVoiceId] = useState(
    preferences?.assistantVoiceId ?? 'assistant-default',
  );
  const [narrationVoiceId, setNarrationVoiceId] = useState(
    preferences?.narrationVoiceId ?? 'narrator-default',
  );
  const [transcriptOptIn, setTranscriptOptIn] = useState(preferences?.transcriptOptIn ?? false);

  const assistantOptions = useMemo(
    () => VOICES.filter((voice) => voice.voiceId.startsWith('assistant')),
    [],
  );
  const narratorOptions = useMemo(
    () => VOICES.filter((voice) => voice.voiceId.startsWith('narrator')),
    [],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await updatePreferences('traveler-001', {
      profileId: 'traveler-001',
      assistantVoiceId,
      narrationVoiceId,
      transcriptOptIn,
    });
  };

  return (
    <section className="preferences-page">
      <header>
        <h1>Traveler Preferences</h1>
      </header>
      <form onSubmit={handleSubmit}>
        <label>
          Assistant Voice
          <select
            value={assistantVoiceId}
            onChange={(event) => setAssistantVoiceId(event.target.value)}
          >
            {assistantOptions.map((voice) => (
              <option key={voice.voiceId} value={voice.voiceId}>
                {voice.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Narrator Voice
          <select
            value={narrationVoiceId}
            onChange={(event) => setNarrationVoiceId(event.target.value)}
          >
            {narratorOptions.map((voice) => (
              <option key={voice.voiceId} value={voice.voiceId}>
                {voice.displayName}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={transcriptOptIn}
            onChange={(event) => setTranscriptOptIn(event.target.checked)}
          />
          Receive narrated transcripts
        </label>
        <button type="submit">Save preferences</button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <h2>Voice feedback</h2>
        <BreathingOrb status="idle" message="Listening preview" />
      </div>
    </section>
  );
};

export default PreferencesPage;
