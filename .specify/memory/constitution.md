# Trip Narrator Web Constitution

## Core Principles

### I. Code Quality & Style
- Enforce ESLint + Prettier configurations for all TypeScript/JavaScript artifacts; follow PEP 8 for any Python modules.
- Practice strict TDD/BDD: author failing unit/integration tests before implementation; maintain >90% coverage per package.
- Use semantic commit prefixes (`feat:`, `fix:`, `chore:`, etc.); every change flows through PR review.
- Branch names follow `00X-feature-name` matching Spec Kit feature directories; keep branches short-lived.

### II. Testing & Continuous Integration
- All PRs must pass GitHub Actions workflows covering lint, unit, integration, and accessibility (axe-core) suites.
- Mock external APIs (routing, POI, TTS) in automated tests; no live calls in CI.
- Block merges on failing checks, coverage regressions, or accessibility violations.

### III. Voice-First UX & Accessibility
- Primary input/output is voice; always provide text fallbacks for accessibility and noisy environments.
- Display a breathing-orb indicator during listening/speaking states and expose ARIA `aria-live` updates for screen readers.
- Implement dark/light themes with WCAG 2.1 AA contrast, keyboard navigation, focus management, captions/transcripts for narrations, and support for assistive technologies.

### IV. Driving Safety
- Provide only high-level trip context; prohibit turn-by-turn directions to comply with mapping licences.
- Surface narrations well before POIs and design flows to minimize driver interaction while in motion.
- Collect only anonymized trip telemetry; never share or sell data to third parties.

### V. Licensing & Data Compliance
- Use open routing sources (OpenRouteService) and permissible POI datasets (openpoiservice, Foursquare, Yelp where licensed); never embed proprietary geometry.
- Store secrets exclusively in environment variables or secure secrets managers; never commit keys.
- Honor GDPR/CCPA: persist only essential preferences/trips, support export/delete requests, and document retention limits.

### VI. Performance & Architecture
- Target <200 ms backend response times and <2 s PWA load on 3G; cache routing/POI results responsibly.
- Optimize for offline-first PWA behavior with service workers and graceful degradation when APIs are unavailable.
- Stick to the approved stack (React TS frontend; Node/Express backend unless explicitly amended) and justify any additions via governance.

### VII. Documentation & Governance
- Maintain a living `README.md` with setup steps, architectural diagrams, and environment configuration.
- Document major decisions in ADRs or the constitution; amendments require PR approval.
- Execute Spec Kit commands sequentially (`/constitution` → `/clarify` → `/plan` → `/tasks` → `/implement`) to keep artefacts aligned.

## Security Requirements
- Enforce HTTPS for all client-server communication and secure cookie/session handling.
- Implement CORS policies scoped to trusted origins and rate limiting on public endpoints.
- Apply structured logging with redaction of sensitive data; monitor for abuse and intrusion attempts.
- Encrypt sensitive data at rest (database/file storage) and in transit; restrict access via least privilege.

## Performance Standards
- Backend endpoints respond within 200 ms p95 under expected load; map rendering completes within 1 s on mid-tier mobile hardware.
- Voice recognition reactions occur within 200 ms after input completion; audio synthesis queues within 1 s.
- Define budgets for bundle size (<250 KB gzip initial load) and maintain performance regression checks in CI.

## Development Workflow
- Start features by running Spec Kit `/specify` to capture scope; run `/clarify` before `/plan` every time.
- Keep failing tests visible; do not silence or skip without documented rationale.
- Require code reviews with dual approval for security-sensitive changes; reviewers verify constitution adherence.
- Integrate automated accessibility and performance smoke tests before deployments; track metrics post-release.
- Use feature flags for risky deployments; provide rollback strategy and monitoring hooks.

**Version**: 1.0.0 | **Ratified**: 2025-09-29 | **Last Amended**: 2025-09-29
