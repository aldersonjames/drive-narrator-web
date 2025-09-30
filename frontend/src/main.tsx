import React from 'react';
import ReactDOM from 'react-dom/client';

import { registerSW } from 'virtual:pwa-register';

import App from './App';
import './styles/global.css';
import './styles/launch.css';

const mount = document.getElementById('root');

if (mount) {
  const root = ReactDOM.createRoot(mount);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onOfflineReady: () => {
      console.info('Trip Narrator is ready to work offline.');
    },
  });
}
