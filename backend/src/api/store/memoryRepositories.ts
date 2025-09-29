import type {
  TravelerProfileRecord,
  TravelerProfileCreate,
  TravelerProfileUpdate,
} from '../../db/repositories/travelerProfilesRepository';
import type { TripRecord, TripCreate, TripUpdate } from '../../db/repositories/tripsRepository';
import type {
  RouteOptionRecord,
  RouteOptionCreate,
} from '../../db/repositories/routeOptionsRepository';
import type {
  PointOfInterestRecord,
  PointOfInterestCreate,
} from '../../db/repositories/pointsOfInterestRepository';
import type {
  NarrationSessionRecord,
  NarrationSessionCreate,
  NarrationSessionUpdate,
} from '../../db/repositories/narrationSessionsRepository';

export class InMemoryTravelerProfilesRepository {
  private profiles = new Map<string, TravelerProfileRecord>();

  async create(profile: TravelerProfileCreate): Promise<TravelerProfileRecord> {
    const now = new Date().toISOString();
    const record: TravelerProfileRecord = {
      profile_id: profile.profileId,
      display_name: profile.displayName ?? null,
      home_location: profile.homeLocation ?? null,
      interest_tags: JSON.stringify(profile.interestTags),
      assistant_voice_id: profile.assistantVoiceId,
      narration_voice_id: profile.narrationVoiceId,
      transcript_opt_in: profile.transcriptOptIn ? 1 : 0,
      consent_version: profile.consentVersion,
      consent_accepted_at: profile.consentAcceptedAt,
      retention_days: profile.retentionDays ?? 30,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      deletion_request_id: null,
      metadata: profile.metadata ? JSON.stringify(profile.metadata) : null,
    };
    this.profiles.set(record.profile_id, record);
    return record;
  }

  async findById(profileId: string): Promise<TravelerProfileRecord | undefined> {
    const record = this.profiles.get(profileId);
    if (!record || record.deleted_at) {
      return undefined;
    }
    return record;
  }

  async update(
    profileId: string,
    changes: TravelerProfileUpdate,
  ): Promise<TravelerProfileRecord | undefined> {
    const existing = await this.findById(profileId);
    if (!existing) return undefined;

    const updated: TravelerProfileRecord = {
      ...existing,
      display_name: changes.displayName ?? existing.display_name,
      home_location: changes.homeLocation ?? existing.home_location,
      interest_tags: changes.interestTags
        ? JSON.stringify(changes.interestTags)
        : existing.interest_tags,
      assistant_voice_id: changes.assistantVoiceId ?? existing.assistant_voice_id,
      narration_voice_id: changes.narrationVoiceId ?? existing.narration_voice_id,
      transcript_opt_in:
        changes.transcriptOptIn !== undefined
          ? changes.transcriptOptIn
            ? 1
            : 0
          : existing.transcript_opt_in,
      retention_days: changes.retentionDays ?? existing.retention_days,
      metadata:
        changes.metadata !== undefined
          ? changes.metadata
            ? JSON.stringify(changes.metadata)
            : null
          : existing.metadata,
      updated_at: changes.updatedAt,
    };

    this.profiles.set(profileId, updated);
    return updated;
  }

  async softDelete(
    profileId: string,
    deletionRequestId?: string,
    deletedAt?: string,
  ): Promise<void> {
    const record = this.profiles.get(profileId);
    if (!record) return;
    record.deleted_at = deletedAt ?? new Date().toISOString();
    record.deletion_request_id = deletionRequestId ?? `del-${Date.now()}`;
    record.updated_at = record.deleted_at;
    this.profiles.set(profileId, record);
  }
}

export class InMemoryTripsRepository {
  private trips = new Map<string, TripRecord>();

  async create(trip: TripCreate): Promise<TripRecord> {
    const now = new Date().toISOString();
    const record: TripRecord = {
      trip_id: trip.tripId,
      profile_id: trip.profileId,
      origin_raw: trip.originRaw,
      origin_hash: trip.originHash,
      destination_raw: trip.destinationRaw,
      destination_hash: trip.destinationHash,
      departure_time: trip.departureTime,
      interest_tags: JSON.stringify(trip.interestTags),
      status: trip.status ?? 'draft',
      created_at: trip.createdAt ?? now,
      updated_at: trip.updatedAt ?? now,
      last_accessed_at: trip.lastAccessedAt ?? null,
    };
    this.trips.set(record.trip_id, record);
    return record;
  }

  async findById(tripId: string): Promise<TripRecord | undefined> {
    return this.trips.get(tripId);
  }

  async findActiveByProfile(profileId: string): Promise<TripRecord[]> {
    return Array.from(this.trips.values()).filter(
      (trip) =>
        trip.profile_id === profileId && !['archived', 'pending_deletion'].includes(trip.status),
    );
  }

  async update(tripId: string, changes: TripUpdate): Promise<void> {
    const existing = this.trips.get(tripId);
    if (!existing) return;

    const updated: TripRecord = {
      ...existing,
      status: changes.status ?? existing.status,
      interest_tags: changes.interestTags
        ? JSON.stringify(changes.interestTags)
        : existing.interest_tags,
      departure_time: changes.departureTime ?? existing.departure_time,
      last_accessed_at: changes.lastAccessedAt ?? existing.last_accessed_at,
      updated_at: changes.updatedAt,
    };

    this.trips.set(tripId, updated);
  }
}

export class InMemoryRouteOptionsRepository {
  private routeOptions = new Map<string, RouteOptionRecord[]>();

  async insertMany(values: RouteOptionCreate[]): Promise<void> {
    values.forEach((value) => {
      const existing = this.routeOptions.get(value.tripId) ?? [];
      const record: RouteOptionRecord = {
        route_id: value.routeId,
        trip_id: value.tripId,
        source: value.source,
        polyline: value.polyline,
        duration_minutes: value.durationMinutes,
        distance_km: value.distanceKm,
        score: value.score,
        score_breakdown: JSON.stringify(value.scoreBreakdown),
        warnings: JSON.stringify(value.warnings ?? []),
        created_at: value.createdAt ?? new Date().toISOString(),
      };
      this.routeOptions.set(value.tripId, [...existing, record]);
    });
  }

  async findByTripId(tripId: string): Promise<RouteOptionRecord[]> {
    return this.routeOptions.get(tripId) ?? [];
  }

  async deleteByTripId(tripId: string): Promise<void> {
    this.routeOptions.delete(tripId);
  }
}

export class InMemoryPointsOfInterestRepository {
  private poiMap = new Map<string, PointOfInterestRecord[]>();

  async insertMany(values: PointOfInterestCreate[]): Promise<void> {
    values.forEach((value) => {
      const existing = this.poiMap.get(value.routeId) ?? [];
      const record: PointOfInterestRecord = {
        poi_id: value.poiId,
        route_id: value.routeId,
        external_id: value.externalId ?? null,
        provider: value.provider,
        category: value.category,
        relevance: value.relevance,
        coordinates_lat: value.coordinatesLat,
        coordinates_lng: value.coordinatesLng,
        summary: value.summary,
        narration_script: value.narrationScript,
        narration_preview: value.narrationPreview,
        eta_offset_seconds: value.etaOffsetSeconds,
        attribution: JSON.stringify(value.attribution),
        created_at: value.createdAt ?? new Date().toISOString(),
      };
      this.poiMap.set(value.routeId, [...existing, record]);
    });
  }

  async findByRouteId(routeId: string): Promise<PointOfInterestRecord[]> {
    return this.poiMap.get(routeId) ?? [];
  }

  async deleteByRouteId(routeId: string): Promise<void> {
    this.poiMap.delete(routeId);
  }
}

export class InMemoryNarrationSessionsRepository {
  private sessions = new Map<string, NarrationSessionRecord>();

  async create(session: NarrationSessionCreate): Promise<NarrationSessionRecord> {
    const now = new Date().toISOString();
    const record: NarrationSessionRecord = {
      session_id: session.sessionId,
      trip_id: session.tripId,
      profile_id: session.profileId,
      status: session.status ?? 'scheduled',
      started_at: session.startedAt ?? null,
      completed_at: session.completedAt ?? null,
      events: JSON.stringify(session.events ?? []),
      transcript_path: session.transcriptPath ?? null,
      audio_cache_keys: session.audioCacheKeys ? JSON.stringify(session.audioCacheKeys) : null,
      created_at: session.createdAt ?? now,
      updated_at: session.updatedAt ?? now,
    };
    this.sessions.set(record.session_id, record);
    return record;
  }

  async findActiveByTrip(tripId: string): Promise<NarrationSessionRecord[]> {
    return Array.from(this.sessions.values()).filter(
      (record) =>
        record.trip_id === tripId && !['completed', 'pending_deletion'].includes(record.status),
    );
  }

  async update(sessionId: string, updates: NarrationSessionUpdate): Promise<void> {
    const existing = this.sessions.get(sessionId);
    if (!existing) return;

    const updated: NarrationSessionRecord = {
      ...existing,
      status: updates.status ?? existing.status,
      started_at: updates.startedAt ?? existing.started_at,
      completed_at: updates.completedAt ?? existing.completed_at,
      events: updates.events ? JSON.stringify(updates.events) : existing.events,
      transcript_path: updates.transcriptPath ?? existing.transcript_path,
      audio_cache_keys: updates.audioCacheKeys
        ? JSON.stringify(updates.audioCacheKeys)
        : existing.audio_cache_keys,
      updated_at: updates.updatedAt,
    };

    this.sessions.set(sessionId, updated);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    Array.from(this.sessions.values()).forEach((session) => {
      if (session.trip_id === tripId) {
        session.status = 'pending_deletion';
        session.updated_at = new Date().toISOString();
        this.sessions.set(session.session_id, session);
      }
    });
  }
}
