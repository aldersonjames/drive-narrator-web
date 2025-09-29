import type { Knex } from 'knex';

export interface TripRecord {
  trip_id: string;
  profile_id: string;
  origin_raw: string;
  origin_hash: string;
  destination_raw: string;
  destination_hash: string;
  departure_time: string;
  interest_tags: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

export interface TripCreate {
  tripId: string;
  profileId: string;
  originRaw: string;
  originHash: string;
  destinationRaw: string;
  destinationHash: string;
  departureTime: string;
  interestTags: string[];
  status?: 'draft' | 'planned' | 'completed' | 'archived' | 'pending_deletion';
  createdAt?: string;
  updatedAt?: string;
  lastAccessedAt?: string | null;
}

export interface TripUpdate {
  status?: 'draft' | 'planned' | 'completed' | 'archived' | 'pending_deletion';
  interestTags?: string[];
  departureTime?: string;
  lastAccessedAt?: string | null;
  updatedAt: string;
}

export class TripsRepository {
  private readonly table = 'trips';

  constructor(private readonly db: Knex) {}

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

    await this.db<TripRecord>(this.table).insert(record);
    return record;
  }

  async findById(tripId: string): Promise<TripRecord | undefined> {
    return this.db<TripRecord>(this.table).where({ trip_id: tripId }).first();
  }

  async findActiveByProfile(profileId: string): Promise<TripRecord[]> {
    return this.db<TripRecord>(this.table)
      .where({ profile_id: profileId })
      .whereNotIn('status', ['archived', 'pending_deletion'])
      .orderBy('updated_at', 'desc');
  }

  async update(tripId: string, changes: TripUpdate): Promise<void> {
    const updatePayload: Partial<TripRecord> = {
      updated_at: changes.updatedAt,
    };

    if (changes.status) {
      updatePayload.status = changes.status;
    }
    if (changes.interestTags) {
      updatePayload.interest_tags = JSON.stringify(changes.interestTags);
    }
    if (changes.departureTime) {
      updatePayload.departure_time = changes.departureTime;
    }
    if (changes.lastAccessedAt !== undefined) {
      updatePayload.last_accessed_at = changes.lastAccessedAt;
    }

    await this.db<TripRecord>(this.table).where({ trip_id: tripId }).update(updatePayload);
  }
}
