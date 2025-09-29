# Quickstart — Trip Narrator Voice-First MVP

1. **Install prerequisites**
   - Node.js 20.x, npm 10+, bun 1.2+ (for Spec Kit tooling)
   - Map provider token, OpenRouteService key, POI provider key, OpenAI API key (stored in env files)

2. **Bootstrap the workspace**
   ```bash
   npm install
   npm run bootstrap   # if using npm workspaces for frontend/backend packages
   ```

3. **Configure environment variables**
   - Frontend `.env.local`: `VITE_MAPBOX_TOKEN`, `VITE_OPENAI_ENDPOINT`, feature flags for offline caching and accessibility experiments.
   - Backend `.env`: `ORS_API_KEY`, `POI_API_KEY`, `OPENAI_API_KEY`, `DATABASE_URL=sqlite://./data/trip_narrator.db`, `CACHE_TTL_SECONDS`.

4. **Run database migrations**
   ```bash
   npm run backend:migrate
   ```

5. **Start services**
   ```bash
   npm run backend:dev
   npm run frontend:dev
   ```

6. **Execute automated tests**
   ```bash
   npm run test:backend
   npm run test:frontend
   npm run test:accessibility
   ```

7. **Manual verification checklist**
   - Deny microphone permission to confirm text fallback.
   - Request a sample trip and verify route/POI cards render with breathing orb feedback.
   - Toggle dark/light themes and inspect focus states and contrast ratios.
   - Run data deletion flow and confirm SQLite entries removed plus audit log updated.

8. **Build for deployment**
   ```bash
   npm run build:frontend
   npm run build:backend
   docker build -t trip-narrator-backend ./backend
   ```

9. **Next steps**
   - Follow `/tasks` output to drive implementation.
   - Update this quickstart as new tooling emerges (e.g., CI scripts, additional services).

---
*Maintained alongside `plan.md`; revise after Phase 1 artifacts finalize.*
