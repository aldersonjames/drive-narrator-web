import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppNavigation from '../components/navigation/AppNavigation';
import { useDrivePlanner } from '../context/DrivePlannerContext';

const DEFAULT_PROFILE_ID = 'traveler-001';

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, loadPreferences } = useDrivePlanner();

  const profileId = React.useMemo(
    () => preferences?.profileId ?? DEFAULT_PROFILE_ID,
    [preferences],
  );

  React.useEffect(() => {
    void loadPreferences(profileId).catch(() => undefined);
  }, [loadPreferences, profileId]);

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background-light/90 pb-safe-top backdrop-blur-lg dark:bg-background-dark/90">
        <AppNavigation position="top" />
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
          >
            <img src="/icons/arrow-left.svg" alt="Go back" className="h-5 w-5" />
          </button>
          <h1 className="flex-1 pr-10 text-center text-xl font-bold tracking-tight text-white">
            Settings
          </h1>
        </div>
      </header>

      <main className="divide-y divide-gray-200/5 dark:divide-gray-800/10">
        {/* Coming Soon Placeholder */}
        <section className="px-4 py-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6 text-center">
            <div className="mb-4">
              <span className="material-symbols-outlined text-4xl text-blue-400">construction</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">More Settings Coming Soon</h3>
            <p className="text-sm text-white/70 mb-4">
              We&apos;re working on drive preferences, notifications, audio controls, and privacy
              settings.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>POI Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Audio Controls</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Privacy Settings</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>Accessibility</span>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-6">
          <h2 className="px-4 text-sm font-semibold text-white/60">VOICE &amp; NARRATION</h2>
          <div className="mt-2 rounded-xl bg-white/5 dark:bg-white/5">
            <button
              type="button"
              onClick={() => navigate('/voice-settings')}
              className="flex w-full items-center justify-between gap-4 px-4 py-3"
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
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-background-light/90 pb-safe-bottom backdrop-blur-lg dark:bg-background-dark/90">
        <AppNavigation position="bottom" />
      </footer>
    </div>
  );
};

export default SettingsScreen;
