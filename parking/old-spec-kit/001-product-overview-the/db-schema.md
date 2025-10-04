# Database Schema — Trip Narrator Voice-First MVP

Target database: SQLite (via Knex). All timestamps stored in ISO 8601 strings (UTC). UUIDs represented as TEXT.

## traveler_profiles

| Column              | Type    | Constraints / Notes                       |
| ------------------- | ------- | ----------------------------------------- |
| profile_id          | TEXT    | PK, UUID                                  |
| display_name        | TEXT    | Nullable                                  |
| home_location       | TEXT    | Optional free-form or geohash             |
| interest_tags       | TEXT    | JSON array stored as string               |
| assistant_voice_id  | TEXT    | FK → voices.voice_id                      |
| narration_voice_id  | TEXT    | FK → voices.voice_id                      |
| transcript_opt_in   | INTEGER | 0/1 boolean                               |
| consent_version     | TEXT    | Required                                  |
| consent_accepted_at | TEXT    | ISO timestamp                             |
| retention_days      | INTEGER | Default 30, CHECK between 7 and 365       |
| created_at          | TEXT    | ISO timestamp                             |
| updated_at          | TEXT    | ISO timestamp                             |
| deleted_at          | TEXT    | Nullable, for soft deletion               |
| deletion_request_id | TEXT    | Nullable, references deletion audit table |
| metadata            | TEXT    | JSON blob for future expansion            |

Index: `idx_profiles_status` on (`deleted_at`, `updated_at`).

## trips

| Column           | Type | Constraints / Notes                                          |
| ---------------- | ---- | ------------------------------------------------------------ |
| trip_id          | TEXT | PK                                                           |
| profile_id       | TEXT | FK → traveler_profiles.profile_id                            |
| origin_raw       | TEXT | Raw address                                                  |
| origin_hash      | TEXT | Hash for analytics                                           |
| destination_raw  | TEXT | Raw address                                                  |
| destination_hash | TEXT | Hash                                                         |
| departure_time   | TEXT | ISO timestamp                                                |
| interest_tags    | TEXT | JSON array                                                   |
| status           | TEXT | Enum (draft, planned, completed, archived, pending_deletion) |
| created_at       | TEXT |                                                              |
| updated_at       | TEXT |                                                              |
| last_accessed_at | TEXT | Nullable                                                     |

Indexes: `idx_trips_profile_status` on (`profile_id`, `status`, `updated_at`).

## route_options

| Column           | Type | Notes               |
| ---------------- | ---- | ------------------- |
| route_id         | TEXT | PK                  |
| trip_id          | TEXT | FK → trips.trip_id  |
| source           | TEXT | Enum `ors`, `cache` |
| polyline         | TEXT | Encoded polyline    |
| duration_minutes | REAL |                     |
| distance_km      | REAL |                     |
| score            | REAL | 0..1                |
| score_breakdown  | TEXT | JSON                |
| warnings         | TEXT | JSON array          |
| created_at       | TEXT |                     |

Index: `idx_route_trip` on (`trip_id`).

## points_of_interest

| Column             | Type    | Notes                               |
| ------------------ | ------- | ----------------------------------- |
| poi_id             | TEXT    | PK                                  |
| route_id           | TEXT    | FK → route_options.route_id         |
| external_id        | TEXT    | Provider ID                         |
| provider           | TEXT    | Enum (`ops`, `foursquare`, `other`) |
| category           | TEXT    | Canonical category                  |
| relevance          | REAL    | 0..1                                |
| coordinates_lat    | REAL    |                                     |
| coordinates_lng    | REAL    |                                     |
| summary            | TEXT    |                                     |
| narration_script   | TEXT    |                                     |
| narration_preview  | TEXT    | 256 char preview                    |
| eta_offset_seconds | INTEGER | Non-negative                        |
| attribution        | TEXT    | JSON (license text, provider info)  |
| created_at         | TEXT    |                                     |

Index: `idx_poi_route` on (`route_id`); optional geospatial index on lat/lng.

## narration_sessions

| Column           | Type | Notes                                                                        |
| ---------------- | ---- | ---------------------------------------------------------------------------- |
| session_id       | TEXT | PK                                                                           |
| trip_id          | TEXT | FK → trips.trip_id                                                           |
| profile_id       | TEXT | FK → traveler_profiles.profile_id                                            |
| status           | TEXT | Enum (`scheduled`, `in_progress`, `completed`, `paused`, `pending_deletion`) |
| started_at       | TEXT | Nullable                                                                     |
| completed_at     | TEXT | Nullable                                                                     |
| events           | TEXT | JSON array                                                                   |
| transcript_path  | TEXT | Nullable                                                                     |
| audio_cache_keys | TEXT | JSON array                                                                   |
| created_at       | TEXT |                                                                              |
| updated_at       | TEXT |                                                                              |

Indexes: `idx_sessions_trip_status` on (`trip_id`, `status`); `idx_sessions_profile` on (`profile_id`).

## voices

Supporting table, optionally seeded.

| Column       | Type | Notes               |
| ------------ | ---- | ------------------- |
| voice_id     | TEXT | PK                  |
| provider     | TEXT | `openai`/`fallback` |
| display_name | TEXT |                     |
| locale       | TEXT | ISO language tag    |
| style_tags   | TEXT | JSON array          |
| sample_url   | TEXT | Optional            |
| created_at   | TEXT |                     |
| updated_at   | TEXT |                     |

## deletion_audit

Tracks deletion requests for compliance.

| Column              | Type | Notes                    |
| ------------------- | ---- | ------------------------ | --------- | ------ |
| deletion_request_id | TEXT | PK                       |
| profile_id          | TEXT | Nullable (bulk deletion) |
| initiated_at        | TEXT |                          |
| status              | TEXT | pending                  | completed | failed |
| completed_at        | TEXT | Nullable                 |
| details             | TEXT | JSON log                 |

---

_Created 2025-09-29._
