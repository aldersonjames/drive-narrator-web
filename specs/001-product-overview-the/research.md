# Phase 0 Research Log — Trip Narrator Voice-First MVP

## Overview
This document captures outstanding investigations required before detailed design. Each item records decisions, rationales, and alternatives as findings emerge.

## Research Topics & Tasks

| ID | Topic | Question | Owner | Status |
|----|-------|----------|-------|--------|
| R1 | OpenRouteService | Clarify quota limits, rate throttling, offline caching feasibility | TBD | Pending |
| R2 | POI Providers | Compare openpoiservice vs. Foursquare/Yelp licensing, category coverage, rate limits | TBD | Pending |
| R3 | Voice Pipeline | Measure Web Speech API support matrix and OpenAI TTS latency/caching requirements | TBD | Pending |
| R4 | Mapping Stack | Evaluate Mapbox GL JS vs. Leaflet for accessibility tooling, offline tiles, performance | TBD | Pending |
| R5 | Privacy Compliance | Define GDPR/CCPA consent, deletion workflows, retention periods | TBD | Pending |
| R6 | Offline Strategy | Design service worker caching for routes, POIs, audio, and map tiles | TBD | Pending |
| R7 | Accessibility | Compile WCAG 2.1 AA checklist specific to voice-first UI (captions, aria-live, focus management) | TBD | Pending |

## Data Collection Plan
- Gather API documentation and community guidance for routing and POI services.
- Prototype voice recognition and synthesis latency in target browsers.
- Audit accessibility tooling compatibility with chosen map library.
- Consult legal/privacy resources for consent and data deletion language.

## Next Steps
1. Assign owners for each research topic and capture outcomes in the table above.
2. Summarize findings per topic with "Decision", "Rationale", and "Alternatives" subsections.
3. Update the constitution or spec if research introduces new constraints or clarifications.

---
*Document created 2025-09-29; update as research completes.*
