import React from 'react';
import ReactDOM from 'react-dom/client';

import { registerSW } from 'virtual:pwa-register';

import App from './App';
import { ErrorBoundary } from './components/system/ErrorBoundary';
import { TripPlannerProvider } from './context/TripPlannerContext';
import './styles/global.css';
import './styles/launch.css';

const mount = document.getElementById('root');

if (mount) {
  const root = ReactDOM.createRoot(mount);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <TripPlannerProvider>
          <App />
        </TripPlannerProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onOfflineReady: () => {
      console.info('Trip Narrator is ready to work offline.');
    },
  });
} else if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((registration) => registration.unregister());
  });
  console.info('Service worker disabled during development for a clean slate.');
}
