import React from 'react';

import { TripPlannerProvider } from './context/TripPlannerContext';
import TripPlannerPage from './pages/TripPlannerPage';
import PreferencesPage from './pages/PreferencesPage';

export const App: React.FC = () => {
  return (
    <TripPlannerProvider>
      <main className="app-shell">
        <TripPlannerPage />
        <PreferencesPage />
      </main>
    </TripPlannerProvider>
  );
};

export default App;
