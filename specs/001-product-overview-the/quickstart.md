# Quickstart — Trip Narrator Voice-First MVP

## 1. Install prerequisites

- Node.js 20.x (LTS), npm 10+
- bun 1.2+ (already installed for Spec Kit CLI builds)
- Git, Docker Desktop (for backend container later)
- API credentials: Mapbox token, OpenRouteService key, POI provider key (OPS/Foursquare), OpenAI API key

## 2. Bootstrap workspace

```bash
npm install            # installs root dev tooling + sets up husky
npm run bootstrap      # ensures frontend/, backend/, shared/ deps resolve (workspaces)
```

## 3. Configure environment variables

Create the following files (never commit them):

- `backend/.env`
  ```env
  ORS_API_KEY=changeme
  POI_PROVIDER=ops
  POI_API_KEY=optional-for-foursquare
  # Optional: unlock Foursquare Places once your key is approved
  FOURSQUARE_API_KEY=
  OPENAI_API_KEY=changeme
  DATABASE_URL=sqlite://./data/trip_narrator.db
  CACHE_TTL_SECONDS=900
  RETENTION_DAYS=30
  ```
- `frontend/.env.local`
  ```env
  VITE_MAPBOX_TOKEN=changeme
  VITE_OPENAI_ENDPOINT=https://api.openai.com/v1/realtime
  VITE_FEATURE_OFFLINE_AUDIO=true
  ```

## 4. Validate tooling

```bash
npm run lint           # currently echoes for each workspace; will execute once implementations land
npm run test           # placeholder until suites are written (Phase 3.2 tasks)
npx lint-staged --dry-run
```

## 5. Workspace structure (post-bootstrap)

```
frontend/
  package.json         # scoped scripts for lint/test/build (placeholders for now)
  tsconfig.json
  src/                 # React components, hooks, context
  tests/               # unit/integration, accessibility, e2e specs

backend/
  package.json         # Node/Express service scripts
  tsconfig.json
  src/                 # api/, services/, db/, utils/
  tests/               # contract, integration, unit suites

shared/
  package.json
  tsconfig.json
  schemas/             # JSON schema + OpenAPI fragments
  types/               # shared TypeScript definitions
```

## 6. Husky hook

Husky is preconfigured to run `lint-staged` on commit. To re-install after a clean checkout:

```bash
npm install
```

(Husky’s `prepare` script runs automatically.)

## 7. Common commands (once implementations exist)

```bash
npm run lint -- --filter=frontend        # lint frontend workspace
npm run test -- --filter=@trip-narrator/backend  # run backend jest suite via turbo
npm run format                           # prettify repo
```

```bash
npm run dev    # launches backend + frontend via Vite (http://localhost:5173)
```

### API Endpoints (dev harness)

- `POST /api/routes` — generate candidate trips and scored POIs
- `GET /api/poi/categories` — fetch the full OPS taxonomy (cached)
- `GET /api/pois?routeId=...` — retrieve filtered POIs for a selected route
- `GET /api/voices` — list available assistant/narrator voices
- `GET|PATCH /api/preferences` — traveler preference persistence (requires profile header)
- `GET|POST|DELETE /api/trips` — create/manage stored trips

## 8. Manual smoke checklist (baseline)

- Deny microphone permission → text fallback should appear.
- Trigger sample trip (mock data until APIs wired) → verify breathing orb transitions.
- Toggle themes → inspect contrast & focus outlines.
- Simulate deletion flow → confirm records removed and audit log entry written (once implementation complete).

## 9. Deployment prep (later tasks)

```bash
npm run build        # once scripts implemented, builds frontend + backend
docker build -t trip-narrator-backend ./backend
```

Update this document as scripts mature and new services are added.
