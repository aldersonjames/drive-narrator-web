import React, { useState } from 'react';

import { TripPlannerProvider } from './context/TripPlannerContext';
import TripPlannerPage from './pages/TripPlannerPage';
import PreferencesPage from './pages/PreferencesPage';
import LandingPage from './pages/LandingPage';

export const App: React.FC = () => {
  const [showLanding, setShowLanding] = useState(true);

  const handleStartJourney = () => setShowLanding(false);
  const handleSkipTutorial = () => setShowLanding(false);

  return (
    <TripPlannerProvider>
      {showLanding ? (
        <LandingPage onStartJourney={handleStartJourney} onSkipTutorial={handleSkipTutorial} />
      ) : (
        <main className="app-shell">
          <TripPlannerPage />
          <PreferencesPage />
        </main>
      )}
    </TripPlannerProvider>
  );
};

export default App;
