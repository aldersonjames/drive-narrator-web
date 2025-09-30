# Quickstart — Trip Narrator Voice-First MVP

## 1. Install prerequisites

- Node.js 20.x (LTS) & npm 10+
- bun 1.2+ (for Spec Kit CLI tasks)
- Git, Docker Desktop (for optional backend containers)
- API keys: OpenRouteService, POI provider (OPS/Foursquare), MapLibre/Mapbox tiles, OpenAI Realtime (optional ElevenLabs)

## 2. Bootstrap workspace

```bash
npm install            # installs root tooling, sets up husky
npm run bootstrap      # installs frontend/backend/shared workspaces
```

## 3. Configure environment variables

Create:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**backend/.env**

```env
# core API
PORT=3000
CORS_ALLOWED_ORIGINS=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
DEFAULT_CACHE_TTL_MS=300000

# routing + POIs
ORS_API_KEY=
POI_PROVIDER=ops
POI_API_BASE_URL=https://api.openpoiservice.org
POI_API_PATH=v1/pois
POI_ALLOW_UNAUTHENTICATED=false
POI_CACHE_TTL_MS=900000
POI_CATEGORY_CACHE_TTL_MS=900000
FOURSQUARE_API_KEY=
FOURSQUARE_API_BASE_URL=https://api.foursquare.com/v3

# voice pipeline
OPENAI_API_KEY=
ELEVENLABS_API_KEY=
VOICE_ASR_PROVIDER=openai
VOICE_TTS_PROVIDER=openai
VOICE_NARRATION_PROVIDER=openai
VOICE_REGION=iad
VOICE_MODEL_OPENAI=gpt-4o-realtime-preview
VOICE_VOICE_OPENAI=alloy
SESSION_TTL_SECONDS=300
RATE_LIMIT_PER_DEVICE=8
VOICE_LATENCY_TARGET_MS=350
VOICE_LATENCY_MAX_MS=1200
VOICE_CAP_MAX_INPUT_MS=15000
```

**frontend/.env.local**

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_MAPBOX_TOKEN=
VITE_OPENAI_ENDPOINT=https://api.openai.com/v1/realtime
```

## 4. Optional: self-host OPS

```bash
git clone https://github.com/GIScience/openpoiservice.git ~/AI_Development/Projects/openpoiservice
cd ~/AI_Development/Projects/openpoiservice
docker compose up init
docker compose up -d api
```

Set in `backend/.env`:

```env
POI_PROVIDER=ops
POI_API_BASE_URL=http://localhost:5500
POI_API_PATH=pois
POI_ALLOW_UNAUTHENTICATED=true
```

## 5. Common commands

```bash
npm run lint
npm run format
npm run test

npm run dev --workspace @trip-narrator/backend     # backend API
npm run dev --workspace @trip-narrator/frontend    # frontend Launch Experience (http://localhost:5173)

npm run typecheck --workspace @trip-narrator/backend
npm run typecheck --workspace @trip-narrator/frontend
```

Front end hot reloads with mock voice events; backend exposes JSON APIs and voice session endpoint.

## 6. Workspace structure

```
frontend/src      # components (orb, map, carousel, timeline, transcript), hooks, pages, styles, mock
backend/src       # api routes, services, db repos, utils
shared/types      # cross-workspace TS definitions
tests/            # backend & frontend suites (unit/integration)
references/       # ui-components.md (open-licensed inspirations)
```

## 7. Manual smoke

- `npm run dev --workspace @trip-narrator/frontend` → orb breathes, hero map renders.
- Transcript pill slides in during demo voice loop; carousel snaps to selected route.
- Dark mode toggle (system) updates hero + cards.
- `POST http://localhost:3000/api/voice/session` returns session token payload with latency/cap caps.

## 8. Deployment prep (later)

```bash
npm run build --workspace @trip-narrator/backend
npm run build --workspace @trip-narrator/frontend
docker build -t trip-narrator-backend ./backend
```

Update this quickstart as new scripts and providers land.
