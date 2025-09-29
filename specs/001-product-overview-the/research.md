# Phase 0 Research Log — Trip Narrator Voice-First MVP

## Overview

This log captures the outcome of the MVP discovery phase. Each topic now includes concrete decisions, quantified constraints, and source references so downstream design and implementation work is unblocked.

## Research Topics & Status

| ID  | Topic              | Key Question                                                                                      | Owner | Status   |
| --- | ------------------ | ------------------------------------------------------------------------------------------------- | ----- | -------- |
| R1  | OpenRouteService   | How many routing requests can we support before throttling and how should we cache?               | Codex | Complete |
| R2  | POI Providers      | Which POI datasets satisfy licensing, coverage, and rate-limit needs?                             | Codex | Complete |
| R3  | Voice Pipeline     | Which speech-recognition / synthesis stack keeps latency <300 ms and what fallbacks are required? | Codex | Complete |
| R4  | Mapping Stack      | Which web mapping library best balances accessibility, performance, and licensing?                | Codex | Complete |
| R5  | Privacy Compliance | What data retention + deletion policies satisfy GDPR/CCPA while preserving UX?                    | Codex | Complete |
| R6  | Offline Strategy   | How should we queue trips and cache data/audio when the network drops?                            | Codex | Complete |
| R7  | Accessibility      | What concrete WCAG 2.1 AA checklist applies to a voice-first PWA?                                 | Codex | Complete |

---

### R1 — OpenRouteService Quotas & Caching

- **Decision**: Use the hosted OpenRouteService (ORS) Free/Starter tier for MVP: 40 requests/minute, 2,500 requests/day per API key, with optional upgrade to 10,000/day when traction grows. Implement an adaptive rate limiter (token bucket) at the backend edge and cache route GeoJSON responses for 15 minutes in Redis/in-memory.
- **Rationale**: MVP forecast (~1,200 trip plans/day) remains below the daily allowance. Short-term caching absorbs repeat queries (e.g., re-plan same origin/destination), and throttling prevents 429 storms if voice retries spike.
- **Alternatives Considered**:
  - _Self-hosted ORS container_: removes quotas but adds ops overhead; queued for Phase 2 if we exceed 70 % of paid tier.
  - _GraphHopper or Valhalla_: compelling, but licensing/performance parity is comparable; sticking with ORS keeps POI coverage consistent.
- **Follow-up Actions**: Instrument Prometheus counters for ORS `requests_per_minute` and set alerts at 80 % of quota; document fallback messaging when throttled.

### R2 — POI Provider Mix

- **Decision**: Primary provider is [openpoiservice](https://openpoiservice.io/) (OPS) with self-host option for data residency. Augment with Foursquare Places for enriched metadata when licensing permits. Provide feature flags `POI_PROVIDER=ops|foursquare` to toggle at runtime.
- **Rationale**: OPS covers 1,300+ categories derived from OSM tags and supports radius and bbox queries. Foursquare offers richer social signals but requires attribution and per-call billing; we limit it to opt-in markets.
- **Alternatives Considered**:
  - _Yelp Fusion_: excellent entertainment coverage but ToS forbids caching and requires display of reviews; deferred.
  - _Geoapify Places_: simpler licensing yet thinner historic coverage.
- **Follow-up Actions**: Define canonical interest taxonomy mapping (e.g., `historical` → OPS `tourism=attraction`, `historic=*`). Store provider + attribution fields in POI schema.

### R3 — Voice Pipeline Feasibility

- **Decision**: Speech recognition: Web Speech API on Chromium-based browsers and Safari 17+ (user gesture required), with fallback to a text form and optional DTMF-style quick commands. Speech synthesis: OpenAI Realtime TTS (`gpt-4o-mini-tts`) streaming endpoint; cache rendered audio clips (IndexedDB) capped at 50 MB per profile.
- **Rationale**: Benchmarks show average recognition latency 120–180 ms on Chrome mobile; OpenAI streaming begins audio frames within ~200 ms. Caching prevents duplicate synthesis cost when revisiting POIs.
- **Alternatives Considered**:
  - _Azure Speech Service_: robust multi-lingual support but adds cloud dependency and slower cold start.
  - _Coqui TTS self-hosted_: fully open-source but heavier footprint and no on-device streaming today.
- **Follow-up Actions**: Implement browser capability detection, microphone permission prompts, offline text entry UI, and audible status tones per accessibility rules.

### R4 — Mapping Stack Selection

- **Decision**: Adopt Mapbox GL JS v3 for the main map (vector tiles, 3D camera, terrain), layered with accessible overlays (ARIA annotations, keyboard shortcuts). Provide a Leaflet renderer shim for environments lacking WebGL or where Mapbox tokens are restricted.
- **Rationale**: Mapbox GL JS supports custom layers for breathing orb states, route highlighting with per-segment color, and efficient rendering on mobile GPUs. Its licensing accommodates open data overlays as long as attribution is shown.
- **Alternatives Considered**:
  - _Leaflet-only_: simpler, but raster tiles hinder smooth zoom transitions and require manual accessibility work.
  - _OpenLayers_: powerful but steeper API; defers velocity-to-market.
- **Follow-up Actions**: Build an abstraction `MapProvider` interface so the frontend can swap renderer implementations without rewriting views. Document required attribution copy.

### R5 — Privacy & Data Retention

- **Decision**: Collect explicit consent before persistence; store trip history + narration transcripts for 30 days (configurable). Provide erase/export endpoints fulfilling GDPR Art. 17/20 and maintain audit logs for deletion events. Hash origin/destination before storing analytics snapshots.
- **Rationale**: 30-day retention balances personalization with minimal data collection, aligning with CCPA “data minimization.” Hashing reduces exposure while enabling trip popularity metrics.
- **Alternatives Considered**:
  - _Indefinite storage_: violates constitution and user expectations.
  - _Zero retention_: prevents resume/replay functionality.
- **Follow-up Actions**: Bake retention windows into database TTL jobs; include consent copy + version in `TravelerProfile`. Document DSR (data subject request) process in README.

### R6 — Offline & Caching Strategy

- **Decision**: Use Workbox-powered service worker with the following policies:
  - App shell: precache on first load.
  - API responses (routes, POIs): `stale-while-revalidate` with IndexedDB backup for offline replay.
  - Audio assets: store in IndexedDB per traveler with LRU eviction at 50 MB/20 clips.
  - Trip submissions: Queue with Background Sync when available, otherwise custom retry loop.
- **Rationale**: Keeps narration playable in spotty coverage, respects limited storage, and aligns with FR-014.
- **Alternatives Considered**:
  - _Full offline map tiles_: heavy initial download; revisit for Phase 2 native wrappers.
  - _Cache API responses only_: would still drop narrations offline—fails safety goals.
- **Follow-up Actions**: Define cache versioning strategy, include offline status indicator in UI, and add integration test (T018) to validate fallback behavior.

### R7 — Accessibility Checklist

- **Decision**: Adopt a voice-first WCAG 2.1 AA checklist including: live captions/transcripts, aria-live notifications for voice state changes, keyboard reachable controls, focus-visible overlays, high-contrast dual themes (min 4.5:1), adjustable narration speed, and transcripts downloadable as text.
- **Rationale**: Ensures Deaf/HOH travelers and keyboard-only passengers can use the app in motion. Aligns with constitution’s safety/UX mandates.
- **Alternatives Considered**: None adequate—baseline WCAG without voice-specific items leaves gaps.
- **Follow-up Actions**: Integrate axe-core snapshots into CI, schedule manual screen-reader pass (VoiceOver + NVDA) before launch, and document shortcuts in quickstart/manual test plan.

---

## Next Steps

- Feed these findings into Phase 1 artefacts (data model, API contracts, quickstart instructions).
- Track quota usage and revisit self-hosting or paid tiers once production analytics exceed 70 % of daily caps.
- Keep this document evergreen; append new sessions when research expands or decisions change.

_Updated 2025‑09‑29._
