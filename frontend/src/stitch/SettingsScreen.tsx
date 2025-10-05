import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppNavigation from '../components/navigation/AppNavigation';
import { useDrivePlanner } from '../context/DrivePlannerContext';
import type { VoiceDefinition } from '../../../shared/types/tripNarrator';
import { DEFAULT_PERSONA_ID, NARRATOR_PERSONAS } from '../../../shared/data/narratorPersonas';

const detourLabels = ['None', 'Short', 'Medium', 'Long'] as const;
const DEFAULT_PROFILE_ID = 'traveler-001';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, loadPreferences, updatePreferences } = useDrivePlanner();

  const profileId = useMemo(() => preferences?.profileId ?? DEFAULT_PROFILE_ID, [preferences]);
  const metadata = preferences?.metadata ?? undefined;

  const [newDiscoveryAlerts, setNewDiscoveryAlerts] = useState<boolean>(true);
  const [approachingPoiAlerts, setApproachingPoiAlerts] = useState<boolean>(true);
  const [detourPreference, setDetourPreference] = useState<number>(1);
  const [backgroundMusic, setBackgroundMusic] = useState<boolean>(false);
  const [voices, setVoices] = useState<VoiceDefinition[]>([]);
  const [voicesLoading, setVoicesLoading] = useState<boolean>(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [assistantVoiceId, setAssistantVoiceId] = useState<string>('');
  const [narrationVoiceId, setNarrationVoiceId] = useState<string>('');
  const [voicesDirty, setVoicesDirty] = useState<boolean>(false);
  const [savingVoices, setSavingVoices] = useState<boolean>(false);
  const [voiceNotice, setVoiceNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [narrationPersonaId, setNarrationPersonaId] = useState<string>(
    preferences?.narrationPersonaId ?? DEFAULT_PERSONA_ID,
  );

  const newDiscoveryId = 'settings-new-discovery';
  const approachingPoiId = 'settings-approaching-poi';
  const backgroundMusicId = 'settings-background-music';
  const detourPreferenceId = 'settings-max-detour';
  const baseAssistantVoiceId = preferences?.assistantVoiceId ?? '';
  const baseNarrationVoiceId = preferences?.narrationVoiceId ?? '';
  const basePersonaId = preferences?.narrationPersonaId ?? DEFAULT_PERSONA_ID;
  const assistantVoice = useMemo(
    () => voices.find((voice) => voice.voiceId === assistantVoiceId),
    [assistantVoiceId, voices],
  );
  const narratorVoice = useMemo(
    () => voices.find((voice) => voice.voiceId === narrationVoiceId),
    [narrationVoiceId, voices],
  );
  const personaOptions = useMemo(() => NARRATOR_PERSONAS, []);
  const personaDirty = narrationPersonaId !== basePersonaId;
  const selectedPersona = useMemo(
    () => personaOptions.find((persona) => persona.id === narrationPersonaId),
    [narrationPersonaId, personaOptions],
  );
  const isPreviewingAssistant = previewingVoiceId === assistantVoiceId && Boolean(previewingVoiceId);
  const isPreviewingNarrator = previewingVoiceId === narrationVoiceId && Boolean(previewingVoiceId);
  const canSaveVoices =
    (voicesDirty || personaDirty) && Boolean(assistantVoiceId) && Boolean(narrationVoiceId);
  const computeVoiceDirty = useCallback(
    (assistant: string, narrator: string) =>
      assistant !== baseAssistantVoiceId || narrator !== baseNarrationVoiceId,
    [baseAssistantVoiceId, baseNarrationVoiceId],
  );

  useEffect(() => {
    void loadPreferences(profileId).catch(() => undefined);
  }, [loadPreferences, profileId]);

  useEffect(() => {
    if (!metadata) return;
    if (typeof metadata.newDiscoveryAlerts === 'boolean') {
      setNewDiscoveryAlerts(metadata.newDiscoveryAlerts);
    }
    if (typeof metadata.approachingPoiAlerts === 'boolean') {
      setApproachingPoiAlerts(metadata.approachingPoiAlerts);
    }
    if (typeof metadata.backgroundMusic === 'boolean') {
      setBackgroundMusic(metadata.backgroundMusic);
    }
    if (typeof metadata.maxDetourPreference === 'number') {
      setDetourPreference(metadata.maxDetourPreference);
    }
  }, [metadata]);

  const loadVoiceOptions = useCallback(async () => {
    setVoicesLoading(true);
    setVoicesError(null);
    try {
      const res = await fetch('/api/voices');
      if (!res.ok) {
        throw new Error(res.statusText || 'Failed to load voices');
      }
      const payload = (await res.json()) as { voices?: VoiceDefinition[] };
      if (isMountedRef.current) {
        setVoices(payload.voices ?? []);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setVoicesError((error as Error).message || 'Unable to load voices');
      }
    } finally {
      if (isMountedRef.current) {
        setVoicesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadVoiceOptions().catch(() => undefined);
  }, [loadVoiceOptions]);

  useEffect(() => {
    if (!preferences) return;
    const matchesCurrent =
      assistantVoiceId === baseAssistantVoiceId && narrationVoiceId === baseNarrationVoiceId;
    if (matchesCurrent && voicesDirty) {
      setVoicesDirty(false);
    }
    if (!voicesDirty) {
      setAssistantVoiceId(baseAssistantVoiceId);
      setNarrationVoiceId(baseNarrationVoiceId);
      setNarrationPersonaId(basePersonaId);
    }
  }, [
    assistantVoiceId,
    baseAssistantVoiceId,
    baseNarrationVoiceId,
    basePersonaId,
    narrationVoiceId,
    preferences,
    voicesDirty,
  ]);

  const stopPreviewPlayback = useCallback(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPreviewingVoiceId(null);
  }, []);

  useEffect(() => {
    if (!voiceNotice) return;
    const timer = window.setTimeout(() => setVoiceNotice(null), 4000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [voiceNotice]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stopPreviewPlayback();
    };
  }, [stopPreviewPlayback]);

  useEffect(() => {
    setVoicesDirty((prev) => {
      const dirty = computeVoiceDirty(assistantVoiceId, narrationVoiceId);
      return dirty === prev ? prev : dirty;
    });
  }, [assistantVoiceId, narrationVoiceId, computeVoiceDirty]);

  const persistMetadata = (next: Partial<typeof metadata>) => {
    void updatePreferences(profileId, {
      metadata: {
        ...(metadata ?? {}),
        ...next,
      },
    }).catch(() => undefined);
  };

  const handleToggle = (key: 'newDiscoveryAlerts' | 'approachingPoiAlerts' | 'backgroundMusic') => {
    if (key === 'newDiscoveryAlerts') {
      const next = !newDiscoveryAlerts;
      setNewDiscoveryAlerts(next);
      persistMetadata({ newDiscoveryAlerts: next });
    } else if (key === 'approachingPoiAlerts') {
      const next = !approachingPoiAlerts;
      setApproachingPoiAlerts(next);
      persistMetadata({ approachingPoiAlerts: next });
    } else {
      const next = !backgroundMusic;
      setBackgroundMusic(next);
      persistMetadata({ backgroundMusic: next });
    }
  };

  const handleDetourChange = (value: number) => {
    setDetourPreference(value);
    persistMetadata({ maxDetourPreference: value });
  };

  const handlePreviewVoice = useCallback(
    (voiceId: string) => {
      const voice = voices.find((item) => item.voiceId === voiceId);
      if (!voice) return;

      stopPreviewPlayback();
      setPreviewingVoiceId(voiceId);

      if (voice.sampleUrl) {
        const audio = new Audio(voice.sampleUrl);
        previewAudioRef.current = audio;
        audio.onended = () => {
          stopPreviewPlayback();
        };
        audio.onerror = () => {
          stopPreviewPlayback();
          setVoiceNotice({ type: 'error', message: 'Unable to play that preview right now.' });
        };
        void audio.play().catch(() => {
          stopPreviewPlayback();
          setVoiceNotice({ type: 'error', message: 'Playback blocked by the browser.' });
        });
        return;
      }

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(
          `Hi there, I'm ${voice.displayName}. Ready to narrate your next drive.`,
        );
        utterance.onend = () => {
          stopPreviewPlayback();
        };
        utterance.onerror = () => {
          stopPreviewPlayback();
          setVoiceNotice({ type: 'error', message: 'Speech preview unavailable right now.' });
        };
        window.speechSynthesis.speak(utterance);
      } else {
        stopPreviewPlayback();
        setVoiceNotice({ type: 'error', message: 'Preview not supported on this device.' });
      }
    },
    [stopPreviewPlayback, voices],
  );

  const handleAssistantVoiceChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value;
      setAssistantVoiceId(next);
      setVoicesDirty(computeVoiceDirty(next, narrationVoiceId));
    },
    [computeVoiceDirty, narrationVoiceId],
  );

  const handleNarrationVoiceChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value;
      setNarrationVoiceId(next);
      setVoicesDirty(computeVoiceDirty(assistantVoiceId, next));
    },
    [assistantVoiceId, computeVoiceDirty],
  );

  const handlePersonaChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setNarrationPersonaId(event.target.value);
  }, []);

  const handleSaveVoices = useCallback(async () => {
    if (!assistantVoiceId || !narrationVoiceId) {
      setVoiceNotice({ type: 'error', message: 'Pick both assistant and narrator voices first.' });
      return;
    }

    setSavingVoices(true);
    setVoiceNotice(null);
    try {
      await updatePreferences(profileId, {
        assistantVoiceId,
        narrationVoiceId,
        narrationPersonaId,
      });
      const personaName = selectedPersona?.name ?? 'your narrator';
      setVoiceNotice({ type: 'success', message: `${personaName} is ready to narrate.` });
    } catch (error) {
      setVoiceNotice({
        type: 'error',
        message: (error as Error).message || 'Unable to save voice preferences.',
      });
    } finally {
      setSavingVoices(false);
    }
  }, [assistantVoiceId, narrationPersonaId, narrationVoiceId, profileId, selectedPersona?.name, updatePreferences]);

  return (
    <div
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-background-light font-display text-white dark:bg-background-dark"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      {/* Top Navigation */}
      <AppNavigation position="top" />
      
      <div className="flex-grow">
        <header className="sticky top-0 z-10 flex items-center bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80"
            aria-label="Go back"
          >
            <svg
              fill="currentColor"
              height="24"
              viewBox="0 0 256 256"
              width="24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
            </svg>
          </button>
          <h1 className="flex-1 pr-10 text-center text-xl font-bold tracking-tight text-white">
            Settings
          </h1>
        </header>

        <main className="divide-y divide-gray-200/5 dark:divide-gray-800/10">
          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-white/60">ACCOUNT</h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-white/5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex flex-col text-left">
                  <span className="font-medium text-white">Email</span>
                  <span className="text-sm text-white/60">
                    sophia.clark@email.com
                  </span>
                </div>
                <span className="material-symbols-outlined text-white/40">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">Change Password</span>
                <span className="material-symbols-outlined text-white/40">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">Profile Picture</span>
                <span className="material-symbols-outlined text-white/40">
                  chevron_right
                </span>
              </button>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-white/60">
              NOTIFICATIONS
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-white/5">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-white">
                  New Discovery Alerts
                </span>
                <label
                  className="relative inline-flex items-center cursor-pointer"
                  htmlFor={newDiscoveryId}
                >
                  <span className="sr-only">Toggle new discovery alerts</span>
                  <input
                    id={newDiscoveryId}
                    type="checkbox"
                    className="sr-only peer"
                    checked={newDiscoveryAlerts}
                    onChange={() => handleToggle('newDiscoveryAlerts')}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700" />
                </label>
              </div>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-white">
                  Approaching POI Alerts
                </span>
                <label
                  className="relative inline-flex items-center cursor-pointer"
                  htmlFor={approachingPoiId}
                >
                  <span className="sr-only">Toggle approaching POI alerts</span>
                  <input
                    id={approachingPoiId}
                    type="checkbox"
                    className="sr-only peer"
                    checked={approachingPoiAlerts}
                    onChange={() => handleToggle('approachingPoiAlerts')}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700" />
                </label>
              </div>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-white/60">
              DETOUR PREFERENCES
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 p-4 dark:bg-white/5">
              <label
                className="mb-2 block font-medium text-white"
                htmlFor={detourPreferenceId}
              >
                Max Detour Distance
              </label>
              <input
                id={detourPreferenceId}
                type="range"
                min={0}
                max={3}
                step={1}
                value={detourPreference}
                onChange={(e) => handleDetourChange(Number(e.target.value))}
                className="w-full cursor-pointer appearance-none rounded-full bg-gray-200 outline-none [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-gray-600 dark:bg-gray-700 dark:[&::-webkit-slider-runnable-track]:bg-gray-500 [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500"
              />
              <div className="mt-2 flex justify-between text-xs text-white/60">
                {detourLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-white/60">
              VOICE &amp; NARRATION
            </h2>
            <div className="mt-2 space-y-4 rounded-xl bg-white/5 p-4 dark:bg-white/5">
              {/* Voice Settings Link */}
              <button
                type="button"
                onClick={() => navigate('/voice-settings')}
                className="flex w-full items-center justify-between rounded-lg bg-primary/10 p-4 transition-colors hover:bg-primary/20"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">record_voice_over</span>
                  <div className="text-left">
                    <p className="font-medium text-white">Voice Settings</p>
                    <p className="text-sm text-white/60">Choose your narration voice</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/40">chevron_right</span>
              </button>

              {voiceNotice ? (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    voiceNotice.type === 'success'
                      ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-400/60 bg-red-500/10 text-red-200'
                  }`}
                  role="alert"
                >
                  {voiceNotice.message}
                </div>
              ) : null}

              {voicesLoading ? (
                <p className="text-sm text-white/60">Loading voices…</p>
              ) : voicesError ? (
                <div className="space-y-3 text-sm text-white/60">
                  <p>{voicesError}</p>
                  <button
                    type="button"
                    onClick={() => loadVoiceOptions().catch(() => undefined)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Try again
                  </button>
                </div>
              ) : voices.length ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl bg-white/5 p-4 dark:bg-black/20">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-100">Assistant voice</h3>
                          <p className="text-xs text-gray-400">
                            Heard in conversations and UI responses.
                          </p>
                        </div>
                        {assistantVoice ? (
                          <button
                            type="button"
                            onClick={() =>
                              isPreviewingAssistant
                                ? stopPreviewPlayback()
                                : handlePreviewVoice(assistantVoice.voiceId)
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                            disabled={savingVoices}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isPreviewingAssistant ? 'stop_circle' : 'play_circle'}
                            </span>
                            {isPreviewingAssistant ? 'Stop preview' : 'Preview'}
                          </button>
                        ) : null}
                      </div>
                      <select
                        value={assistantVoiceId}
                        onChange={handleAssistantVoiceChange}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a voice…</option>
                        {voices.map((voice) => (
                          <option key={voice.voiceId} value={voice.voiceId}>
                            {voice.displayName}
                          </option>
                        ))}
                      </select>
                      {assistantVoice ? (
                        <div className="mt-3 space-y-2 text-xs text-gray-400">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80">
                              Provider: {assistantVoice.provider}
                            </span>
                            <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80">
                              Locale: {assistantVoice.locale}
                            </span>
                            {assistantVoice.styleTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-primary/20 px-2 py-1 text-[11px] text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-2xl bg-white/5 p-4 dark:bg-black/20">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-100">Narrator voice</h3>
                          <p className="text-xs text-gray-400">
                            Leads the storytelling while you drive.
                          </p>
                        </div>
                        {narratorVoice ? (
                          <button
                            type="button"
                            onClick={() =>
                              isPreviewingNarrator
                                ? stopPreviewPlayback()
                                : handlePreviewVoice(narratorVoice.voiceId)
                            }
                            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
                            disabled={savingVoices}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {isPreviewingNarrator ? 'stop_circle' : 'play_circle'}
                            </span>
                            {isPreviewingNarrator ? 'Stop preview' : 'Preview'}
                          </button>
                        ) : null}
                      </div>
                      <select
                        value={narrationVoiceId}
                        onChange={handleNarrationVoiceChange}
                        className="mt-3 w-full rounded-xl border border-white/10 bg-white/10 py-2 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a voice…</option>
                        {voices.map((voice) => (
                          <option key={voice.voiceId} value={voice.voiceId}>
                            {voice.displayName}
                          </option>
                        ))}
                      </select>
                      {narratorVoice ? (
                        <div className="mt-3 space-y-2 text-xs text-gray-400">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80">
                              Provider: {narratorVoice.provider}
                            </span>
                            <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-white/80">
                              Locale: {narratorVoice.locale}
                            </span>
                            {narratorVoice.styleTags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-primary/20 px-2 py-1 text-[11px] text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 p-4 dark:bg-black/20">
                    <h3 className="text-sm font-semibold text-gray-100">Narrator personality</h3>
                    <p className="text-xs text-gray-400">
                      Choose how your storyteller sounds and engages during the drive.
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {personaOptions.map((persona) => {
                        const isActive = narrationPersonaId === persona.id;
                        return (
                          <label
                            key={persona.id}
                            className={`flex cursor-pointer flex-col gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                              isActive
                                ? 'border-primary bg-primary/10 text-white'
                                : 'border-white/10 bg-white/5 text-white/80 hover:border-primary/40 hover:bg-white/10'
                            }`}
                          >
                            <input
                              type="radio"
                              name="narration-persona"
                              value={persona.id}
                              checked={isActive}
                              onChange={handlePersonaChange}
                              className="sr-only"
                            />
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-white">{persona.name}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                persona.category === 'quirky' 
                                  ? 'bg-purple-500/20 text-purple-300' 
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {persona.label}
                              </span>
                            </div>
                            <span className="text-xs leading-relaxed text-white/70">
                              {persona.description}
                            </span>
                 <div className="text-xs italic text-white/60 bg-white/5 rounded-lg p-2">
                   &ldquo;{persona.previewSentence}&rdquo;
                 </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
                    <p>
                      {voices.length} voice options available. Personality presets tailor the tone of every reply.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {previewingVoiceId ? (
                        <button
                          type="button"
                          onClick={stopPreviewPlayback}
                          className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-primary/60 hover:text-primary"
                        >
                          Stop preview
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleSaveVoices}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          canSaveVoices && !savingVoices
                            ? 'bg-primary text-white hover:bg-primary/90'
                            : 'bg-white/10 text-white/60'
                        }`}
                        disabled={!canSaveVoices || savingVoices}
                      >
                        {savingVoices ? 'Saving…' : 'Save voices'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/60">No voices available yet.</p>
              )}
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-white/60">AUDIO</h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-white/5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">Narration Speed</span>
                <span className="text-white/60">1.0x</span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">Volume Control</span>
                <span className="text-white/60">75%</span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-white">Background Music</span>
                <label
                  className="relative inline-flex items-center cursor-pointer"
                  htmlFor={backgroundMusicId}
                >
                  <span className="sr-only">Toggle background music</span>
                  <input
                    id={backgroundMusicId}
                    type="checkbox"
                    className="sr-only peer"
                    checked={backgroundMusic}
                    onChange={() => handleToggle('backgroundMusic')}
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-700" />
                </label>
              </div>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-white/60">
              PRIVACY &amp; INFO
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-white/5">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">Data Usage</span>
                <span className="material-symbols-outlined text-white/40">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">
                  Location Permissions
                </span>
                <span className="material-symbols-outlined text-white/40">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-white">Delete History</span>
                <span className="material-symbols-outlined text-white/40">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-white">Version</span>
                <span className="text-white/60">1.2.3</span>
              </div>
            </div>
          </section>
        </main>
      </div>
      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background-light/90 pb-safe-bottom backdrop-blur-lg dark:bg-background-dark/90">
        <AppNavigation position="bottom" />
      </footer>
    </div>
  );
};

export default SettingsScreen;
