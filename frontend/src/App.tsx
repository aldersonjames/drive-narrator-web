import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, Outlet } from 'react-router-dom';

import WelcomeScreen from './stitch/WelcomeScreen';
import VoiceConversationScreen from './stitch/VoiceConversationScreen';
import DiscoveryScreen from './stitch/DiscoveryScreen';
import NowPlayingScreen from './stitch/NowPlayingScreen';
import TripsScreen from './stitch/TripsScreen';
import SettingsScreen from './stitch/SettingsScreen';

const AppLayout: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-background-light dark:bg-background-dark"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <Outlet />
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
          <Route path="/trips" element={<TripsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
