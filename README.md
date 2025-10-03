# Trip Narrator Web — Voice-First Road Trip Companion

Trip Narrator is a Spec Kit–driven voice-first MVP: a cinematic PWA and TypeScript backend that plan scenic road trips, surface curated points of interest, and narrate stories in a conversational, hands-free experience.

## Current Status

- **Active branch**: `001-product-overview-the`
- **Focus**: Story-first trip planning (voice loop + route highlights), launch experience polish, voice pipeline integration, PWA hardening (T047–T055), final QA (T056–T060).
- **Spec kit**: Constitution, plan, research, contracts, and tasks live under `specs/001-product-overview-the/`.

## Architecture Overview

### Frontend (PWA)

- React 18 + TypeScript (Vite 7).
- Launch Experience: MapLibre hero, Framer Motion breathing orb, Embla carousel for alternate routes, transcript ribbon, narration timeline sheet.
- Trip Planner: conversational console, storyteller map view, and a curated “Story highlights” panel that teases upcoming lore for the selected route.
- Traveler preferences page now returns an in-experience acknowledgement when voices/transcript settings update.
- Voice adapters prepared for OpenAI Realtime/ElevenLabs; demo hook simulates events while the realtime pipeline lands.
- Tailwind-style tokens (CSS vars) for glassmorphism, dark/light themes, fully responsive for phone/tablet.

### Backend

- Node.js 20 + Express 5.
- Routing via OpenRouteService; POIs via self-hosted OpenPoiService (OPS) or Foursquare.
- Voice pipeline (`/api/voice/session`) issues OpenAI Realtime session tokens (WebRTC primary, WebSocket fallback) with modular adapter support for ElevenLabs.
- Conversation endpoint `/api/conversation` plus shared repos/services for routing, scoring, narration scheduling, preferences, and privacy workflows.

### Shared Workspace

- `shared/` exposes JSON schemas and TypeScript types used across frontend and backend (`shared/types/tripNarrator.ts`).

## Getting Started

### Prerequisites

- Node.js 20.x, npm 10+
- bun 1.2+ (already installed for Spec Kit CLI tooling)
- Git, Docker Desktop (for optional backend containers)
- API keys: OpenRouteService, POI provider (OPS/Foursquare), MapLibre/Mapbox tiles, OpenAI Realtime API key (optional ElevenLabs key)

### Bootstrap

```bash
npm install            # installs root tooling, sets up husky
npm run bootstrap      # installs workspace dependencies (frontend/backend/shared)
```

### Environment Variables

Copy examples and customise:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

**Backend (`backend/.env`)**
| Variable | Purpose |
| --- | --- |
| `PORT` | Express port (default 41234). |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins. |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | API rate limiting window + max. |
| `DEFAULT_CACHE_TTL_MS` | fallback cache TTL. |
| `ORS_API_KEY` | OpenRouteService routing key. |
| `POI_PROVIDER` | `ops` or `foursquare`. |
| `POI_API_KEY` / `POI_API_BASE_URL` / `POI_API_PATH` | OPS credentials + endpoint. |
| `POI_ALLOW_UNAUTHENTICATED` | Allow local OPS without auth. |
| `POI_CACHE_TTL_MS` / `POI_CATEGORY_CACHE_TTL_MS` | OPS caching windows. |
| `FOURSQUARE_API_KEY` / `FOURSQUARE_API_BASE_URL` | Optional Foursquare Places. |
| `OPENAI_API_KEY` | OpenAI Realtime voice pipeline key. |
| `ELEVENLABS_API_KEY` | Optional ElevenLabs voice key. |
| `VOICE_ASR_PROVIDER` / `VOICE_TTS_PROVIDER` / `VOICE_NARRATION_PROVIDER` | Provider selection (`openai`/`elevenlabs`). |
| `VOICE_REGION` | Realtime region (default `iad`). |
| `VOICE_MODEL_OPENAI` / `VOICE_VOICE_OPENAI` | Default OpenAI model + voice. |
| `SESSION_TTL_SECONDS` | Voice token TTL (default 300s). |
| `RATE_LIMIT_PER_DEVICE` | Max `/api/voice/session` calls per device window. |
| `VOICE_LATENCY_TARGET_MS` / `VOICE_LATENCY_MAX_MS` | Latency hints surfaced to UI. |
| `VOICE_CAP_MAX_INPUT_MS` | Max utterance length (default 15000 ms). |

**Frontend (`frontend/.env.local`)**
| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base (default `/api`). |
| `VITE_MAPBOX_TOKEN` | Map tiles (optional). |
| `VITE_OPENAI_ENDPOINT` | Override OpenAI Realtime endpoint. |

### Optional: Self-host OPS

```bash
git clone https://github.com/GIScience/openpoiservice.git ~/AI_Development/Projects/openpoiservice
cd ~/AI_Development/Projects/openpoiservice
docker compose up init
docker compose up -d api
# backend/.env additions
POI_PROVIDER=ops
POI_API_BASE_URL=http://localhost:5500
POI_API_PATH=pois
POI_ALLOW_UNAUTHENTICATED=true
```

## Scripts & Workspaces

```bash
npm run lint                           # turbo lint across workspaces
npm run test                           # backend + frontend test suites
npm run format                         # prettier --write .

npm run dev                            # kill stale ports, start backend + frontend, open browser
npm run dev:stop                       # stop dev servers
npm run dev:reset                      # clear local caches (frontend/dev-dist, dist, .vite, .turbo)

npm run dev --workspace @trip-narrator/backend    # backend API only (http://localhost:41234)
npm run dev --workspace @trip-narrator/frontend   # frontend PWA only (http://localhost:5173)
npm run build --workspace @trip-narrator/frontend
npm run build --workspace @trip-narrator/backend
npm run typecheck --workspace @trip-narrator/frontend
npm run typecheck --workspace @trip-narrator/backend
```

## Key Endpoints

- `POST /api/routes` — Generate candidate routes + POIs.
- `GET /api/poi/categories` — OPS taxonomy.
- `GET /api/pois?routeId=` — Filtered POIs for selected route.
- `POST /api/voice/session` — Issue OpenAI Realtime session token & capabilities.
- `GET|PATCH /api/preferences` — Traveler preferences.
- `GET|POST|DELETE /api/trips` — Trip persistence.
- `POST /api/conversation` — Conversational replies + narration segments.

## Project Structure

```
frontend/
  src/
    components/         # orb, map, carousel, timeline, transcript
    hooks/
    pages/
    styles/
    mock/
  tests/
    unit/
    integration/
    accessibility/
    e2e/
backend/
  src/
    api/
    services/
    db/
    utils/
  tests/
    contract/
    integration/
    unit/
shared/
  schemas/
  types/
references/
  ui-components.md     # open-licensed component inspirations
specs/001-product-overview-the/
  plan.md
  research.md
  ...
```

## UI Component References

MIT/Apache-2.0 links for UI building blocks (orb animations, Embla carousel, Radix sheet, Headless UI alerts, etc.) are catalogued in `references/ui-components.md` for quick composability.

## Testing Strategy

- **Backend**: contract/integration/unit suites (`npm run test --workspace @trip-narrator/backend`).
- **Frontend**: unit and integration coverage for launch timeline + story highlights, preferences flow regression (`npm run test --workspace @trip-narrator/frontend`).
- **Type safety**: `npm run typecheck --workspace ...` for both workspaces.
- **Upcoming**: Framer Motion smoke tests and Playwright E2E for offline/voice fallback.

## Manual Smoke Checklist

- Launch PWA → orb animates, hero map + cards render, suggestion chips respond.
- Trigger demo voice hook → transcript pill slides in, timeline updates, orb phases animate.
- Trip Planner → run a plan; confirm the new Story highlights panel teases upcoming stops while the conversation console reflects the selected route.
- Toggle OS dark mode → hero & cards adopt dark palette.
- Backend `/api/voice/session` returns session payload with caps/latency hints.
- `/api/routes` with mock data → carousel highlights selected route.

## Next Steps

1. Wire real voice adapter to OpenAI Realtime (orb driven by live events) and expand telemetry.
2. Finish PWA polish: `vite-plugin-pwa`, offline caching of narration packages, service worker alerts.
3. Complete backend hardening (request validation, structured logging, Docker/CI) before final QA pass.

Enjoy the new voice-first Launch Experience! Run `npm run dev --workspace @trip-narrator/frontend` to explore the cinematic mock while the realtime voice pipeline is finalized.
