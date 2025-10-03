import React, { useMemo, useState } from 'react';

import LandingIntro from './components/landing/LandingIntro';
import LaunchExperience from './pages/LaunchExperience';
import LandingPage from './pages/LandingPage';
import TripPlannerPage from './pages/TripPlannerPage';
import PreferencesPage from './pages/PreferencesPage';

type AppStage = 'intro' | 'tutorial' | 'experience' | 'planner' | 'preferences';

interface AppHeaderProps {
  stage: AppStage;
  onShowIntro: () => void;
  onShowExperience: () => void;
  onShowPlanner: () => void;
  onShowPreferences: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  stage,
  onShowIntro,
  onShowExperience,
  onShowPlanner,
  onShowPreferences,
}) => {
  const activeLabel = useMemo(() => {
    if (stage === 'planner') return 'Route Stories';
    if (stage === 'preferences') return 'Traveler Preferences';
    return 'Journey View';
  }, [stage]);

  return (
    <header className="app-header" role="banner">
      <div className="app-header__brand">
        <button type="button" className="app-header__brand-button" onClick={onShowExperience}>
          Trip Narrator
        </button>
        <span className="app-header__tagline">Story-first companion for the road</span>
      </div>
      <nav aria-label="Primary">
        <span className="visually-hidden" aria-live="polite">
          {activeLabel}
        </span>
        <div className="app-header__actions">
          {stage !== 'intro' && stage !== 'tutorial' ? (
            <button type="button" onClick={onShowExperience}>
              Journey View
            </button>
          ) : null}
          <button type="button" onClick={onShowPlanner}>
            Route Stories
          </button>
          <button type="button" onClick={onShowPreferences}>
            Preferences
          </button>
          <button type="button" onClick={onShowIntro}>
            Intro
          </button>
        </div>
      </nav>
    </header>
  );
};

export const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('intro');

  const showHeader = stage !== 'intro' && stage !== 'tutorial';

  return (
    <div className="app-frame">
      {showHeader ? (
        <AppHeader
          stage={stage}
          onShowIntro={() => setStage('intro')}
          onShowExperience={() => setStage('experience')}
          onShowPlanner={() => setStage('planner')}
          onShowPreferences={() => setStage('preferences')}
        />
      ) : null}

      <main className="app-content">
        {stage === 'intro' ? (
          <LandingIntro
            onSkip={() => setStage('experience')}
            onPlanTrip={() => setStage('planner')}
            onWatchTutorial={() => setStage('tutorial')}
          />
        ) : null}

        {stage === 'tutorial' ? (
          <LandingPage
            onStartJourney={() => setStage('experience')}
            onSkipTutorial={() => setStage('experience')}
          />
        ) : null}

        {stage === 'experience' ? <LaunchExperience /> : null}

        {stage === 'planner' ? <TripPlannerPage /> : null}

        {stage === 'preferences' ? <PreferencesPage /> : null}
      </main>
    </div>
  );
};

export default App;
