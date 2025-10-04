# Phase 1 Data Model — Trip Narrator Voice-First MVP

## Entity Catalogue

### Traveler Profile

- **Description**: Persisted settings for a traveler, including interests, preferred voices, consent flags, and retention preferences.
- **Key Fields**: `profile_id` (UUID, primary key), `display_name`, `home_location` (text or geo-hash), `interest_tags` (string array), `assistant_voice_id`, `narration_voice_id`, `transcript_opt_in` (boolean), `consent_version`, `consent_accepted_at` (timestamp), `retention_days` (int), `created_at`, `updated_at`, soft-delete metadata (`deleted_at`, `deletion_request_id`).
- **Relationships**: One-to-many with Trip Request, Narration Session.
- **Validation Rules**:
  - `interest_tags` must map to canonical taxonomy defined in research (historical, scenic, entertainment, etc.).
  - `assistant_voice_id`/`narration_voice_id` must exist in `voices` catalog; enforce via foreign-key or validation table.
  - `retention_days` defaults to 30, must be between 7 and 365.
  - Consent acceptance timestamp required when profile persisted.
- **State Transitions**:
  - `active` → `pending_deletion` (when traveler requests deletion) → `deleted` (hard purge after retention job runs).

### Trip Request

- **Description**: Represents a planned trip submission and its lifecycle.
- **Key Fields**: `trip_id` (UUID PK), `profile_id`, `origin` (geocoded JSON + hashed string), `destination`, `departure_time`, `interest_tags`, `status` (enum: draft|planned|completed|archived|pending_deletion), `created_at`, `updated_at`, `last_accessed_at`.
- **Relationships**: One-to-many with Route Option; one-to-many with Narration Session.
- **Validation Rules**:
  - Origin/destination required; stored both as raw text and hashed coordinate for analytics.
  - `departure_time` must be in ISO 8601 format; server enforces future-time constraint unless resuming.
  - `status` transitions allowed: draft → planned → completed/archived; planned → pending_deletion when deletion request queued.
- **State Transitions**:
  - `draft` (preferences gathered) → `planned` (routes generated) → `completed` (trip executed) or `archived` (auto after retention). Pending deletion triggers background purge of Route Options, Narration Sessions.

### Route Option

- **Description**: Candidate route generated for a trip, including aggregate scoring metadata.
- **Key Fields**: `route_id` (UUID PK), `trip_id`, `source` (enum: ors|cached), `polyline` (encoded polyline string), `duration_minutes`, `distance_km`, `score` (float 0-1), `score_breakdown` (JSON {poiCount, interestAlignment, scenicness}), `warnings` (JSON array), `created_at`.
- **Relationships**: One-to-many with Point of Interest.
- **Validation Rules**:
  - `score` range 0..1; `score_breakdown` keys must be present with numeric values.
  - `warnings` limited to whitelisted codes (`LIMITED_OPTIONS`, `ROAD_CLOSURE`, etc.).
- **State Transitions**: Immutable after creation except for cached refresh (new record with reference to prior version).

### Point of Interest

- **Description**: POI associated with a route segment, including narrative metadata.
- **Key Fields**: `poi_id` (UUID PK), `route_id`, `external_id`, `provider` (ops|foursquare|other), `category`, `relevance` (0..1), `coordinates` (lat/lng numeric), `summary`, `narration_script`, `narration_preview`, `eta_offset_seconds`, `attribution`, `created_at`.
- **Validation Rules**:
  - `category` maps to canonical taxonomy; ensure provider-specific categories normalized.
  - `eta_offset_seconds` >= 0; narrations scheduled only if offset ≥ minimum lead time (default 120s).
  - `narration_script` sanitized to prevent HTML injection; limit length (<= 2,000 chars).
- **Relationships**: Many-to-one with Route Option.

### Narration Session

- **Description**: Sequence of voice interactions for a trip.
- **Key Fields**: `session_id` (UUID PK), `trip_id`, `profile_id`, `status` (enum: scheduled|in_progress|completed|paused|pending_deletion), `started_at`, `completed_at`, `events` (JSON array of {type: listen|speak, timestamp, poiId?}), `transcript_path`, `audio_cache_keys` (array), `created_at`.
- **Validation Rules**:
  - `events` must be chronological; transitions enforced by scheduler.
  - `transcript_path` required when `transcript_opt_in` true; else null.
- **State Transitions**:
  - `scheduled` → `in_progress` → `completed`.
  - `in_progress` ↔ `paused` (e.g., offline) → `completed` or `pending_deletion`.
  - Deletion triggers removal of transcripts/audio within retention SLA.

### Voice Catalog (supporting entity)

- **Description**: Available voice personas.
- **Fields**: `voice_id`, `provider`, `display_name`, `style_tags[]`, `locale`, `gender`, `sample_url`, `created_at`, `updated_at`.
- **Usage**: Reference table for preferences validation and front-end selection.

## Validation Matrix (excerpt)

| Entity            | Field              | Validation                                                     |
| ----------------- | ------------------ | -------------------------------------------------------------- |
| Traveler Profile  | assistant_voice_id | Must exist in Voice Catalog                                    |
| Traveler Profile  | transcript_opt_in  | Default false; requires consent copy shown                     |
| Trip Request      | departure_time     | ISO 8601, not older than now minus 24h                         |
| Trip Request      | status             | Draft→Planned→Completed/Archived; no backwards transitions     |
| Route Option      | score              | 0 ≤ score ≤ 1                                                  |
| Route Option      | warnings           | Only allowed codes (`LIMITED_OPTIONS`, `FERRY_REQUIRED`, etc.) |
| Point of Interest | category           | Maps to canonical taxonomy table                               |
| Narration Session | events             | Sorted ascending by timestamp; type limited to enum            |

## State Transition Summary

```
Traveler Profile: active → pending_deletion → deleted
Trip Request   : draft → planned → completed | archived
Narration Sess.: scheduled → in_progress → completed → pending_deletion
```

## Derived Views / Indices

- `trip_requests`: composite index on (`profile_id`, `status`, `updated_at`) for resume queries.
- `points_of_interest`: geospatial index on coordinates for proximity lookups.
- `narration_sessions`: index on (`trip_id`, `status`) to fetch active sessions quickly.

---

_Updated 2025-09-29._
