# Phase 0 Research Log — Trip Narrator Voice-First MVP

## Overview
This document captures required investigations and the resulting decisions that unlock detailed design. Each topic records the decision, rationale, and alternatives for future reference.

## Research Topics & Status

| ID | Topic | Question | Owner | Status |
|----|-------|----------|-------|--------|
| R1 | OpenRouteService | Clarify quota limits, rate throttling, offline caching feasibility | Codex | Complete |
| R2 | POI Providers | Compare openpoiservice vs. Foursquare/Yelp licensing, category coverage, rate limits | Codex | Complete |
| R3 | Voice Pipeline | Measure Web Speech API support matrix and OpenAI TTS latency/caching requirements | Codex | Complete |
| R4 | Mapping Stack | Evaluate Mapbox GL JS vs. Leaflet for accessibility tooling, offline tiles, performance | Codex | Complete |
| R5 | Privacy Compliance | Define GDPR/CCPA consent, deletion workflows, retention periods | Codex | Complete |
| R6 | Offline Strategy | Design service worker caching for routes, POIs, audio, and map tiles | Codex | Complete |
| R7 | Accessibility | Compile WCAG 2.1 AA checklist specific to voice-first UI (captions, aria-live, focus management) | Codex | Complete |

## Findings by Topic

### R1 — OpenRouteService Quotas & Caching
- **Decision**: Use OpenRouteService hosted API for MVP with standard tier limits (40 req/minute, ~2,500 directions calls/day), backed by an adaptive throttle and per-key usage metrics. Prepare containerized ORS deployment docs in case consumption outgrows hosted limits.
- **Rationale**: The standard limits cover projected MVP usage (<2,000 trip plans/day). Applying client-side debouncing and backend request coalescing avoids bursts that exceed the 40 req/min cap. Metering via Prometheus counters enables alerting at 80% of quota.
- **Alternatives**:
  - *Self-host ORS*: Eliminates quotas but adds DevOps overhead; reserved for Phase 2.
  - *Other routing APIs (e.g., HERE)*: Offer higher limits but introduce licensing incompatibilities with open-data requirement.
- **Action Items**: Implement configurable throttle middleware and cache route responses for 15 minutes to absorb repeated queries.

### R2 — POI Provider Mix
- **Decision**: Default to openpoiservice (OPS) categories (culture, entertainment, nature) with optional Foursquare Places integration for enriched metadata when licenses permit. All external calls go through a provider abstraction to support future swaps.
- **Rationale**: OPS aligns with open-data mandate, provides category filters, and can be self-hosted. Foursquare enriches limited regions with crowdsourced reviews but requires attribution and per-call billing—exposed as a feature flag.
- **Alternatives**:
  - *Yelp Fusion*: Rich entertainment coverage but licensing prohibits caching; deferred.
  - *Geoapify Places*: Simplified but less granular interest tags.
- **Action Items**: Map traveler interest taxonomy to OPS categories; store attribution metadata for each POI.

### R3 — Voice Pipeline Feasibility
- **Decision**: Target Chrome, Edge, and Safari (>=17) for Web Speech recognition; fall back to text input when unsupported or microphone denied. Use OpenAI Realtime TTS (streaming) with local caching of rendered audio files capped at 50 MB per user session.
- **Rationale**: Chrome/Edge offer stable recognition; Safari recently enabled speech recognition behind user gestures. Firefox lacks built-in recognition, so text fallback ensures coverage. OpenAI’s streaming TTS typically begins output within ~150–300 ms, and caching prevents repeat synthesis costs.
- **Alternatives**:
  - *Azure Cognitive Services Speech SDK*: Robust but adds vendor lock-in and extra latency across regions.
  - *Coqui TTS self-hosted*: Open-source but heavier infra and not tuned for realtime mobile latency.
- **Action Items**: Implement feature detection, microphone permission checks, and transcripts persisted alongside audio for accessibility.

### R4 — Mapping Stack Selection
- **Decision**: Adopt Mapbox GL JS for MVP with vector tiles, accessibility helpers, and offline tile caching, while keeping Leaflet as a fallback rendering layer for low-powered devices.
- **Rationale**: Mapbox GL supports WebGL styling, route highlighting, and screen-reader annotations via custom layers. It also provides token-based pricing aligned with open data overlays. Leaflet fallback ensures compatibility where WebGL is blocked.
- **Alternatives**:
  - *Leaflet-only*: Simpler but lacks performant vector rendering and native 3D tilt/rotation.
  - *OpenLayers*: Powerful but steeper learning curve and heavier bundle.
- **Action Items**: Encapsulate map rendering behind a React component so switching providers later only touches a single abstraction.

### R5 — Privacy & Data Retention
- **Decision**: Collect explicit consent before persisting preferences. Retain trip history and narration transcripts for 30 days by default, purge automatically when a user requests deletion or upon expiry. Store hashed identifiers for locations when analytics needed.
- **Rationale**: 30-day window balances personalization with minimal data retention, easing GDPR/CCPA compliance. Hashing protects PII while still supporting aggregate insights.
- **Alternatives**:
  - *Indefinite retention*: Violates privacy commitments.
  - *No persistence*: Undermines primary user story of reusable preferences.
- **Action Items**: Implement deletion service with audit trail, document consent text, and provide export functionality in Phase 2.

### R6 — Offline & Caching Strategy
- **Decision**: Employ a service worker (Workbox) to precache shell assets, queue trip submissions when offline, and cache route/POI responses plus synthesized audio snippets using Cache Storage + IndexedDB. Define cache eviction policy (LRU, max 100 entries or 50 MB).
- **Rationale**: Ensures degraded connectivity still allows trip review and narration playback. Workbox streamlines strategies (stale-while-revalidate for map tiles, network-first for fresh routes).
- **Alternatives**:
  - *AppCache / manual caching*: Deprecated or error-prone.
  - *Full offline map bundle*: Excessive initial download; revisit post-MVP.
- **Action Items**: Document caching matrix in quickstart, include unit tests for queue replay, and expose offline status in UI.

### R7 — Accessibility Checklist
- **Decision**: Adopt WCAG 2.1 AA checklist focused on voice-first experiences: captions/transcripts for all audio, aria-live updates for dynamic states, focus-visible styling, keyboard access for every control, and high-contrast themes.
- **Rationale**: Aligns with constitution and ensures usability for drivers and passengers with assistive tech. Voice interactions alone are insufficient; transcripts and shortcuts support Deaf/HOH users.
- **Alternatives**:
  - *Basic compliance (color contrast only)*: Misses voice-specific requirements.
- **Action Items**: Integrate axe checks in CI, schedule manual screen-reader verification, and document keyboard shortcuts in the quickstart/manual test plan.

## Next Steps
- Feed these decisions into design deliverables (contracts, data model, quickstart).
- Revisit R1/R2 limits once production traffic data is available; consider self-hosting or paid tiers if we approach 80% of quotas.
- Track open questions in tasks.md during implementation.

---
*Updated 2025-09-29.*
