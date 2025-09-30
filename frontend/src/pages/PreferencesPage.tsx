import React, { useEffect, useMemo, useState } from 'react';

import { useTripPlanner } from '../context/TripPlannerContext';
import BreathingOrb from '../components/voice/BreathingOrb';
import type { PoiProviderId, ProviderCapabilityMap } from '../../../shared/types/tripNarrator';

const VOICES = [
  { voiceId: 'assistant-default', displayName: 'Assistant Default' },
  { voiceId: 'assistant-calm', displayName: 'Assistant Calm' },
  { voiceId: 'assistant-serene', displayName: 'Assistant Serene' },
  { voiceId: 'narrator-default', displayName: 'Narrator Default' },
  { voiceId: 'narrator-story', displayName: 'Narrator Story' },
  { voiceId: 'narrator-storyteller', displayName: 'Narrator Storyteller' },
];

const DEFAULT_PROVIDER_CAPABILITIES: ProviderCapabilityMap = {
  ops: {
    available: true,
    locked: false,
    label: 'Open POI Service',
    description: 'Open data backed by OpenPoiService with curated taxonomy mapping.',
  },
  foursquare: {
    available: false,
    locked: true,
    label: 'Foursquare Places',
    description: 'Connect a Foursquare Places API key to unlock premium metadata.',
  },
};

export const PreferencesPage: React.FC = () => {
  const { preferences, updatePreferences, loadPreferences } = useTripPlanner();
  const [assistantVoiceId, setAssistantVoiceId] = useState(
    preferences?.assistantVoiceId ?? 'assistant-default',
  );
  const [narrationVoiceId, setNarrationVoiceId] = useState(
    preferences?.narrationVoiceId ?? 'narrator-default',
  );
  const [transcriptOptIn, setTranscriptOptIn] = useState(preferences?.transcriptOptIn ?? false);
  const [poiProvider, setPoiProvider] = useState<PoiProviderId>(preferences?.poiProvider ?? 'ops');

  useEffect(() => {
    if (!preferences) {
      void loadPreferences('traveler-001');
    }
  }, [preferences, loadPreferences]);

  useEffect(() => {
    if (!preferences) {
      return;
    }
    setAssistantVoiceId(preferences.assistantVoiceId);
    setNarrationVoiceId(preferences.narrationVoiceId);
    setTranscriptOptIn(preferences.transcriptOptIn);

    const nextProvider =
      preferences.providerCapabilities.foursquare.locked && preferences.poiProvider === 'foursquare'
        ? 'ops'
        : preferences.poiProvider;
    setPoiProvider(nextProvider);
  }, [preferences]);

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
      assistantVoiceId,
      narrationVoiceId,
      transcriptOptIn,
      poiProvider,
    });
  };

  const providerCapabilities = preferences?.providerCapabilities ?? DEFAULT_PROVIDER_CAPABILITIES;
  const isFoursquareLocked = providerCapabilities.foursquare.locked;

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

        <fieldset style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem' }}>
          <legend style={{ padding: '0 0.5rem' }}>Points of interest provider</legend>
          <p style={{ marginTop: 0, color: '#475569', fontSize: '0.9rem' }}>
            Toggle richer commercial metadata when Foursquare credentials are configured.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="poi-provider"
                  value="ops"
                  checked={poiProvider === 'ops'}
                  onChange={() => setPoiProvider('ops')}
                />
                <strong>{providerCapabilities.ops.label}</strong>
              </span>
              <small style={{ color: '#64748B' }}>{providerCapabilities.ops.description}</small>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="radio"
                  name="poi-provider"
                  value="foursquare"
                  checked={poiProvider === 'foursquare'}
                  onChange={() => {
                    if (isFoursquareLocked) return;
                    setPoiProvider('foursquare');
                  }}
                  disabled={isFoursquareLocked}
                />
                <strong>{providerCapabilities.foursquare.label}</strong>
              </span>
              <small style={{ color: isFoursquareLocked ? '#EF4444' : '#64748B' }}>
                {providerCapabilities.foursquare.description}
              </small>
            </label>
          </div>
        </fieldset>

        <button type="submit">Save preferences</button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <h2>Voice feedback</h2>
        <BreathingOrb
          messages={{ idle: 'Tap start listening for a preview', listening: 'Listening…' }}
        />
      </div>
    </section>
  );
};

export default PreferencesPage;
