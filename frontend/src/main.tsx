import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';

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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.ts').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
