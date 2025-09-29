# Trip Narrator Web — Voice-First Road Trip Companion

This repository contains the Spec Kit–driven implementation of the Trip Narrator voice-first MVP: a cross-platform PWA and supporting backend that plan road trips, surface points of interest aligned to traveler interests, and narrate stories with synthesized voices while maintaining strict safety, accessibility, and privacy standards.

## Current Status

- **Active Branch**: `001-product-overview-the`
- **Spec Kit Workflow**:
  - Constitution: `.specify/memory/constitution.md`
  - Feature Spec: `specs/001-product-overview-the/spec.md`
  - Clarifications: embedded in spec under `## Clarifications`
  - Implementation Plan: `specs/001-product-overview-the/plan.md`
  - Research: `specs/001-product-overview-the/research.md`
  - Data Model: `specs/001-product-overview-the/data-model.md`
  - API Contracts: `specs/001-product-overview-the/contracts/openapi.yaml`
  - DB Schema Plan: `specs/001-product-overview-the/db-schema.md`
  - Task List: `specs/001-product-overview-the/tasks.md`

Phase 3.3a shipped core services, MapLibre UI, and the conversational assistant console (T061–T073). Current focus: polish passes (map photostrips, landing tutorial), PWA/validation hardening (T047–T055), and final QA sweep.

## Architecture Overview

### Frontend (PWA)

- React 18 + TypeScript, PWA-first.
- Conversational console powered by Web Speech API capture + sequential TTS playback via the shared `VoiceOutputService`.
- Map rendering via MapLibre GL to display alternate routes, GeoJSON polylines, and POI photostrips.
- Accessibility-first UI with ARIA live regions, interactive breathing orb indicator, dark/light theming groundwork.

### Backend

- Node.js 20 + Express 5 (TypeScript).
- Integrates OpenRouteService for routing, openpoiservice/Foursquare for POIs.
- Conversational service generates assistant replies + follow-up prompts, exposed via `/api/conversation`.
- SQLite via Knex for persistence (migrations forthcoming) with repositories/services layered for routing, POI filtering, scoring, narration scheduling, and preferences.

### Shared

- `shared/` workspace holds JSON Schemas and TypeScript types shared across frontend/backend.

## Getting Started

### Prerequisites

- Node.js 20.x, npm 10+
- bun 1.2+ (already installed for Spec Kit CLI build tooling)
- Git, Docker Desktop (for backend container later)
- API credentials: Mapbox token, OpenRouteService key, POI provider key, OpenAI API key

#### Optional: Self-host openpoiservice for POIs

If you don’t have a managed POI API key yet, you can run the open-source openpoiservice locally:

1. Install Docker Desktop (already running in this setup).
2. Clone and start the stack (maps the API to host port `5500` to avoid conflicts):
   ```bash
   git clone https://github.com/GIScience/openpoiservice.git ~/AI_Development/Projects/openpoiservice
   cd ~/AI_Development/Projects/openpoiservice
   # optional: adjust docker-compose.yml to use "5500:5000" if port 5000 is busy
   docker compose up init        # imports sample POI data
   docker compose up -d api      # starts the API at http://localhost:5500
   ```
3. Test it (note the bounding box is two coordinate pairs):
   ```bash
   curl -X POST http://localhost:5500/pois \
     -H "Content-Type: application/json" \
     -d '{
           "request": "pois",
           "geometry": { "bbox": [[8.70, 53.05], [8.85, 53.15]] },
           "limit": 5
         }'
   ```
4. Configure Trip Narrator to use the local instance by adding to `backend/.env`:
   ```env
   POI_PROVIDER=ops
   POI_API_BASE_URL=http://localhost:5500
   ```

Manage the containers through Docker Desktop (`ops-db` and `ops-api` should both be running).

### Bootstrap

```bash
npm install            # installs root tooling, sets up husky
npm run bootstrap      # installs workspace dependencies (frontend/backend/shared)
```

### Environment Variables

Create local env files (never commit them):

- `backend/.env`
- `frontend/.env.local`

Reference values are documented in `specs/001-product-overview-the/quickstart.md`.

### Tooling Scripts

```bash
npm run lint          # turbo-run lint across workspaces (placeholder until implementations exist)
npm run test          # turbo-run test suites (currently red until implementation)
npm run format        # prettier --write .
npm run dev           # start backend (express) and frontend (vite) together
```

Husky pre-commit hook runs `lint-staged` to enforce ESLint + Prettier.

## Testing Strategy

- **Contract Tests**: backend tests in `backend/tests/contract/` assert API contracts (routes, POIs, conversation, etc.) against mocked services.
- **Integration Tests**: `backend/tests/integration/` orchestrate routing + POI flows.
- **Unit Tests**: services in `backend/tests/unit/`; React components in `frontend/tests/unit/`.
- **Accessibility**: `frontend/tests/accessibility/` runs axe.
- **E2E**: Playwright in `frontend/tests/e2e/` covers offline voice fallback (future run once polish stabilises).
  TypeScript type-checking and Jest suites are being brought online as part of hardening (see T047–T052).

## Project Structure

```
backend/
  src/              # to be populated (api/routes, services, db, utils)
  tests/
    contract/
    integration/
    unit/
frontend/
  src/
  tests/
    unit/
    integration/
    accessibility/
    e2e/
shared/
  schemas/
  types/
specs/001-product-overview-the/
  plan.md
  research.md
  data-model.md
  quickstart.md
  contracts/
  db-schema.md
  tasks.md
```

## Workflow & Governance

- Follow Spec Kit command order: `/constitution` → `/clarify` → `/plan` → `/tasks` → `/implement`.
- Maintain >90% test coverage, mock external APIs, enforce WCAG 2.1 AA accessibility.
- All commits use conventional prefixes (e.g., `feat:`, `fix:`, `test:`).
- Feature branches follow `00X-feature-name`; current development uses `001-product-overview-the`.

## Next Steps

1. Polish UI layers to match hero screenshots (map card imagery, dark mode, tutorial carousel — T070/T074).
2. Harden the platform: PWA rebuild via `vite-plugin-pwa`, runtime validation/logging, rate limiting, Docker/CI scaffolding (T047–T055).
3. Final QA pass (accessibility, performance, manual scripts) ahead of launch (T056–T060).

For detailed task sequencing, see `specs/001-product-overview-the/tasks.md`.
