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

Phase 3.3 (services) in progress—migrations, repositories, and backend service layer are complete (T021–T029). Next milestone: Express controllers / API wiring (T030–T034) followed by frontend UI wiring.

## Architecture Overview

### Frontend (PWA)

- React 18 + TypeScript, PWA-first.
- Uses Web Speech API for voice input and OpenAI Realtime TTS for voice output.
- Map rendering via Mapbox GL JS (Leaflet fallback planned).
- Accessibility-first UI with ARIA live regions, breathing orb indicator, dark/light themes.

### Backend

- Node.js 20 + Express 5 (TypeScript).
- Integrates OpenRouteService for routing, openpoiservice/Foursquare for POIs.
- SQLite via Knex for persistence (migrations forthcoming).
- Service modules planned for routing, POI filtering, scoring, and narration scheduling.

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
```

Husky pre-commit hook runs `lint-staged` to enforce ESLint + Prettier.

## Testing Strategy

- **Contract Tests**: backend tests in `backend/tests/contract/` assert API contracts against mocked services.
- **Integration Tests**: `backend/tests/integration/` orchestrate routing + POI flows.
- **Unit Tests**: services in `backend/tests/unit/`; React components in `frontend/tests/unit/`.
- **Accessibility**: `frontend/tests/accessibility/` runs axe.
- **E2E**: Playwright in `frontend/tests/e2e/` covers offline voice fallback.
  All tests are TDD-first; suites currently fail awaiting implementation.

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

1. Finish backend hardening/CI tasks (rate limiting, logging, secrets, containerization — T047–T055).
2. Implement frontend state/context, voice/map components, and offline worker (T038–T046).
3. Execute validation passes (accessibility, performance, manual plan) and final regression (T056–T060).

For detailed task sequencing, see `specs/001-product-overview-the/tasks.md`.
