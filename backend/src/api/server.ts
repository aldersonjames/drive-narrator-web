import http from 'node:http';
import path from 'node:path';

import { loadEnv } from '../utils/loadEnv';

// Load .env from backend directory first, then from project root
loadEnv('.env');
loadEnv(path.resolve(__dirname, '../../.env'));

const loadApp = async () => {
  const module = await import('./app');
  return module.default ?? module;
};

void loadApp().then((app) => {
  const PORT = Number(process.env.PORT ?? 41234);
  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log('Shutting down backend server...');
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
