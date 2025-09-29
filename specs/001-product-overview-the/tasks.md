# Tasks: Trip Narrator Voice-First MVP

**Input**: Design documents from `/specs/001-product-overview-the/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 3.1: Setup & Research Closeout
- [ ] T001 Capture completed findings for R1–R7 in `specs/001-product-overview-the/research.md` with Decision/Rationale/Alternatives summaries.
- [ ] T002 Scaffold workspace packages (`package.json`, `tsconfig.json`, `turbo.json`) and directories `frontend/`, `backend/`, `shared/` per plan.md.
- [ ] T003 Configure unified linting/formatting/test scripts (`.eslintrc.cjs`, `.prettierrc`, `package.json` scripts, Husky hook) enforcing constitution rules.

## Phase 3.2: Tests First (TDD)
- [ ] T004 [P] Author contract test for `POST /api/routes` in `backend/tests/contract/routes.post.test.ts` (mock routing + POI services).
- [ ] T005 [P] Author contract test for `GET /api/pois?routeId=` in `backend/tests/contract/pois.get.test.ts` (ensures filtering + notices).
- [ ] T006 [P] Author contract test for `POST /api/trips` in `backend/tests/contract/trips.post.test.ts` (persistence + consent checks).
- [ ] T007 [P] Author contract test for `GET /api/preferences` in `backend/tests/contract/preferences.get.test.ts` (defaults + stored voices).
- [ ] T008 [P] Author contract test for `PATCH /api/preferences` in `backend/tests/contract/preferences.patch.test.ts` (voice updates + validation).
- [ ] T009 [P] Write integration flow test for multi-route ranking in `backend/tests/integration/trip-planning.flow.test.ts` (A/B route coverage notices).
- [ ] T010 [P] Write integration flow test for voice persona selection + transcripts in `backend/tests/integration/voice-selection.flow.test.ts`.
- [ ] T011 [P] Write integration flow test for trip resume + history deletion in `backend/tests/integration/trip-resume.flow.test.ts`.
- [ ] T012 [P] Create unit test for route scoring service in `backend/tests/unit/services/routeScoring.test.ts` (diversity, tie-breakers).
- [ ] T013 [P] Create unit test for POI filtering/caching in `backend/tests/unit/services/poiFilter.test.ts`.
- [ ] T014 [P] Create unit test for narration scheduler in `backend/tests/unit/services/narrationScheduler.test.ts` (advance timing logic).
- [ ] T015 [P] Build React Testing Library test for breathing orb state machine in `frontend/tests/unit/components/breathingOrb.test.tsx`.
- [ ] T016 [P] Build component test for map route rendering with color legend in `frontend/tests/unit/components/mapRoutes.test.tsx`.
- [ ] T017 [P] Build integration test for preferences page voice selection + transcript toggle in `frontend/tests/integration/preferencesPage.test.tsx`.
- [ ] T018 [P] Build Playwright E2E test for offline voice fallback in `frontend/tests/e2e/offline-voice.spec.ts`.
- [ ] T019 [P] Add service worker caching unit test in `frontend/tests/unit/serviceWorkerCaching.test.ts` (routes/POIs/audio queues).
- [ ] T020 [P] Add accessibility regression test with axe for trip planner page in `frontend/tests/accessibility/tripPlanner.a11y.test.tsx`.

## Phase 3.3: Core Implementation (execute after T004–T020 are red)
- [ ] T021 Create Knex migrations for `traveler_profiles` and repository in `backend/src/db/migrations/2025092901_create_traveler_profiles.ts` & `backend/src/db/repositories/travelerProfilesRepository.ts`.
- [ ] T022 Create Knex migrations for `trip_requests`, `route_options`, `points_of_interest`, `narration_sessions` in `backend/src/db/migrations/2025092902_create_trip_domain.ts` with referential keys.
- [ ] T023 Implement repositories for trips, routes, POIs, narration sessions in `backend/src/db/repositories/*Repository.ts` with privacy-aware queries.
- [ ] T024 Implement OpenRouteService client with retry + caching in `backend/src/services/routing/openRouteServiceClient.ts` (using env vars).
- [ ] T025 Implement POI provider client abstraction in `backend/src/services/poi/poiProviderClient.ts` with source attribution.
- [ ] T026 Implement POI filtering service in `backend/src/services/poi/poiFilteringService.ts` (interest taxonomy + no-match notice logic).
- [ ] T027 Implement route scoring service in `backend/src/services/scoring/routeScoringService.ts` (count, diversity, relevance weights).
- [ ] T028 Implement narration scheduler in `backend/src/services/narration/narrationScheduler.ts` (ETA offsets + avoidance of immediate POIs).
- [ ] T029 Implement preferences service in `backend/src/services/preferences/preferencesService.ts` (voice selections, deletion flow).
- [ ] T030 Implement Express router for `/api/routes` in `backend/src/api/routes/routesController.ts` wiring clients + scoring.
- [ ] T031 Implement Express router for `/api/pois` in `backend/src/api/routes/poisController.ts` returning filtered POIs + notices.
- [ ] T032 Implement Express router for `/api/trips` in `backend/src/api/routes/tripsController.ts` covering create/list/resume/delete.
- [ ] T033 Implement Express router for `/api/preferences` in `backend/src/api/routes/preferencesController.ts` (GET & PATCH).
- [ ] T034 Implement Express router for `/api/voices` in `backend/src/api/routes/voicesController.ts` (OpenAI voice catalog proxy).
- [ ] T035 Wire authentication + consent middleware in `backend/src/api/middleware/privacyMiddleware.ts` (consent checks, deletion triggers).
- [ ] T036 Implement caching layer (Redis-like fallback via in-memory) in `backend/src/utils/cache.ts` with TTL from config.
- [ ] T037 Implement shared type definitions in `shared/types/tripNarrator.ts` and JSON schemas in `shared/schemas/*.json`.
- [ ] T038 Implement React context for trip planner state in `frontend/src/context/TripPlannerContext.tsx` (preferences, routes, POIs).
- [ ] T039 Implement Web Speech voice input hook in `frontend/src/hooks/useVoiceInput.ts` (mic permission, fallback).
- [ ] T040 Implement voice output service in `frontend/src/services/voice/voiceOutputService.ts` (OpenAI TTS streaming + captions cache).
- [ ] T041 Build breathing orb component in `frontend/src/components/voice/BreathingOrb.tsx` with aria-live updates.
- [ ] T042 Build map routes component in `frontend/src/components/map/MapRoutes.tsx` using Mapbox GL (color legend, markers, highlights).
- [ ] T043 Build preferences page in `frontend/src/pages/PreferencesPage.tsx` (interest taxonomy, voice selection, consent toggles).
- [ ] T044 Build trip planner page in `frontend/src/pages/TripPlannerPage.tsx` (origin/destination form, route list, breathing orb wiring).
- [ ] T045 Build narration timeline overlay component in `frontend/src/components/voice/NarrationTimeline.tsx` (upcoming POIs with captions).
- [ ] T046 Implement offline queue & caching worker in `frontend/src/services/offline/offlineQueue.ts` plus service worker in `frontend/src/sw.ts`.

## Phase 3.4: Integration & Hardening
- [ ] T047 Integrate service worker build + registration in `frontend/src/main.tsx` and Vite config for precaching routes/POIs/audio.
- [ ] T048 Configure backend env validation + secrets loading in `backend/src/config/env.ts` (zod schema, secure defaults).
- [ ] T049 Add structured logging + redaction in `backend/src/utils/logger.ts` and apply middleware.
- [ ] T050 Implement deletion workflow (preferences + trip history) with audit log in `backend/src/services/privacy/deletionService.ts` and controller wiring.
- [ ] T051 Add rate limiting & CORS configuration in `backend/src/api/middleware/securityMiddleware.ts` aligned with constitution.
- [ ] T052 Configure CI pipelines (`.github/workflows/ci.yml`) running lint, unit, integration, axe, Playwright suites plus coverage gates.
- [ ] T053 Containerize backend with Dockerfile + docker-compose including SQLite volume at `backend/Dockerfile` and root `docker-compose.yml`.
- [ ] T054 Wire GitHub Actions secrets + environment documentation in `README.md` and `.env.example` files.
- [ ] T055 Implement performance budget checks (bundle analyzer + lighthouse) in `frontend/package.json` scripts `test:performance`.

## Phase 3.5: Polish & Validation
- [ ] T056 Execute accessibility audit playbook; document findings in `docs/accessibility-report.md`.
- [ ] T057 Execute performance + load smoke tests (k6 or autocannon) for routing endpoints; capture metrics in `docs/performance-report.md`.
- [ ] T058 Finalize end-to-end manual validation script in `docs/manual-test-plan.md` (voice, offline, deletion).
- [ ] T059 Update root `README.md` with architecture diagram, setup steps, and troubleshooting from quickstart.
- [ ] T060 Run final regression (all npm scripts) and ensure green CI before requesting review.

## Dependencies
- T001 → T002 (research informs scaffold scope).
- T002/T003 must complete before any test or implementation work.
- T004–T020 must exist and fail before starting T021–T046.
- Backend repositories/services (T021–T029) block controllers (T030–T034) and middleware (T035).
- Controllers (T030–T034) block integration tasks T047–T055.
- Frontend context/services (T038–T040) precede components (T041–T045) and offline worker (T046).
- Integration hardening (T047–T055) precedes polish tasks (T056–T060).

## Parallel Execution Example
```
# After T004–T020 are authored, run these in parallel (different files, no overlap):
- T004: backend/tests/contract/routes.post.test.ts
- T005: backend/tests/contract/pois.get.test.ts
- T012: backend/tests/unit/services/routeScoring.test.ts
- T015: frontend/tests/unit/components/breathingOrb.test.tsx
```

## Notes
- Mark tasks complete only when associated tests or artifacts exist in git.
- Maintain TDD discipline: do not implement code covered by pending tests until the related test task is complete.
- Use feature branches (`001-...`) and commit per task with conventional prefixes.
- Update agent context via `.specify/scripts/bash/update-agent-context.sh copilot` after major planning/design milestones.
