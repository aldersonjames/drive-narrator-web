import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { useTripPlanner } from '../context/TripPlannerContext';

const detourLabels = ['None', 'Short', 'Medium', 'Long'] as const;
const DEFAULT_PROFILE_ID = 'traveler-001';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, loadPreferences, updatePreferences } = useTripPlanner();

  const profileId = useMemo(() => preferences?.profileId ?? DEFAULT_PROFILE_ID, [preferences]);
  const metadata = preferences?.metadata ?? undefined;

  const [newDiscoveryAlerts, setNewDiscoveryAlerts] = useState<boolean>(true);
  const [approachingPoiAlerts, setApproachingPoiAlerts] = useState<boolean>(true);
  const [detourPreference, setDetourPreference] = useState<number>(1);
  const [backgroundMusic, setBackgroundMusic] = useState<boolean>(false);

  const newDiscoveryId = 'settings-new-discovery';
  const approachingPoiId = 'settings-approaching-poi';
  const backgroundMusicId = 'settings-background-music';
  const detourPreferenceId = 'settings-max-detour';

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

  return (
    <div
      className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-background-light font-display text-gray-800 dark:bg-background-dark dark:text-gray-200"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <div className="flex-grow">
        <header className="sticky top-0 z-10 flex items-center bg-background-light/80 p-4 pb-2 backdrop-blur-sm dark:bg-background-dark/80">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 dark:text-gray-300"
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
          <h1 className="flex-1 pr-10 text-center text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Settings
          </h1>
        </header>

        <main className="divide-y divide-gray-200/5 dark:divide-gray-800/10">
          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">ACCOUNT</h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <div className="flex flex-col text-left">
                  <span className="font-medium text-gray-900 dark:text-white">Email</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    sophia.clark@email.com
                  </span>
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">Change Password</span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">Profile Picture</span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
                  chevron_right
                </span>
              </button>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              NOTIFICATIONS
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-gray-900 dark:text-white">
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
                <span className="font-medium text-gray-900 dark:text-white">
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
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              DETOUR PREFERENCES
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 p-4 dark:bg-zinc-800">
              <label
                className="mb-2 block font-medium text-gray-900 dark:text-white"
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
              <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {detourLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-6">
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">AUDIO</h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">Narration Speed</span>
                <span className="text-gray-500 dark:text-gray-400">1.0x</span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">Volume Control</span>
                <span className="text-gray-500 dark:text-gray-400">75%</span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-gray-900 dark:text-white">Background Music</span>
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
            <h2 className="px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
              PRIVACY &amp; INFO
            </h2>
            <div className="mt-2 rounded-xl bg-white/5 dark:bg-zinc-800">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">Data Usage</span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  Location Permissions
                </span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3"
              >
                <span className="font-medium text-gray-900 dark:text-white">Delete History</span>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
                  chevron_right
                </span>
              </button>
              <hr className="mx-4 border-t border-gray-200/10 dark:border-gray-700" />
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="font-medium text-gray-900 dark:text-white">Version</span>
                <span className="text-gray-500 dark:text-gray-400">1.2.3</span>
              </div>
            </div>
          </section>
        </main>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200/10 bg-background-light/90 pb-safe-bottom backdrop-blur-lg dark:border-gray-800/20 dark:bg-background-dark/90">
        <nav className="flex items-center justify-around px-2 pt-2">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <span className="material-symbols-outlined">explore</span>
            <span className="text-xs font-medium">Discoveries</span>
          </NavLink>
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <span className="material-symbols-outlined">bookmark</span>
            <span className="text-xs font-medium">Trips</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-1 transition-colors ${
                isActive
                  ? 'rounded-full bg-amber-500/10 text-amber-500'
                  : 'text-gray-500 dark:text-gray-400'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </nav>
      </footer>
    </div>
  );
};

export default SettingsScreen;
