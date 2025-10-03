import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Outlet, useLocation } from 'react-router-dom';

import BottomNav from './stitch/BottomNav';
import WelcomeScreen from './stitch/WelcomeScreen';
import VoiceConversationScreen from './stitch/VoiceConversationScreen';
import DiscoveryScreen from './stitch/DiscoveryScreen';
import NowPlayingScreen from './stitch/NowPlayingScreen';
import JourneyMemoriesScreen from './stitch/JourneyMemoriesScreen';
import SettingsScreen from './stitch/SettingsScreen';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const showNav = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-background-light text-white dark:bg-background-dark">
      <div className="pb-24">
        <Outlet />
      </div>
      {showNav ? <BottomNav /> : null}
    </div>
  );
};

export const App: React.FC = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route element={<AppLayout />}>
          <Route path="/voice" element={<VoiceConversationScreen />} />
          <Route path="/discoveries" element={<DiscoveryScreen />} />
          <Route path="/now-playing" element={<NowPlayingScreen />} />
          <Route path="/memories" element={<JourneyMemoriesScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
