# Phase 1 Data Model — Trip Narrator Voice-First MVP

## Entity Catalogue (Initial Outline)

### Traveler Profile
- **Description**: Persisted settings for a traveler, including interests, preferred voices, consent flags.
- **Key Fields**: `profileId`, `displayName`, `homeLocation`, `interestTags[]`, `assistantVoiceId`, `narrationVoiceId`, `consentVersion`, `createdAt`, `updatedAt`.
- **Relationships**: One-to-many with Trip Request, Narration Session.
- **Notes**: Capture consent timestamps for GDPR/CCPA compliance.

### Trip Request
- **Description**: Represents a planned trip submission.
- **Key Fields**: `tripId`, `profileId`, `origin`, `destination`, `departureTime`, `interestTags[]`, `createdAt`, `status` (draft|planned|archived).
- **Relationships**: One-to-many with Route Option.
- **Notes**: Store hashed origin/destination when anonymization required.

### Route Option
- **Description**: Candidate route generated for a trip.
- **Key Fields**: `routeId`, `tripId`, `polyline`, `duration`, `distance`, `score`, `scoreBreakdown`, `warnings[]`.
- **Relationships**: One-to-many with Point of Interest.
- **Notes**: Maintain source attribution for routing data.

### Point of Interest
- **Description**: POI associated with a route segment.
- **Key Fields**: `poiId`, `routeId`, `externalSource`, `category`, `coordinates`, `summary`, `narrationScript`, `attribution`, `etaOffset`.
- **Relationships**: Many-to-one with Route Option.
- **Notes**: `etaOffset` controls narration timing.

### Narration Session
- **Description**: Sequence of voice interactions for a trip.
- **Key Fields**: `sessionId`, `tripId`, `profileId`, `startedAt`, `completedAt`, `events[]` (listen|speak with timestamps), `transcriptPath`.
- **Relationships**: Many-to-one with Trip Request and Traveler Profile.
- **Notes**: Ensure transcripts stored for accessibility and deletable on request.

## Pending Design Work
- Add validation matrices (required vs. optional fields, formats).
- Define state transitions for Trip Request and Narration Session.
- Specify indexing strategy for geospatial queries/cache keys.

---
*Drafted 2025-09-29; populate with finalized schemas post-research.*
