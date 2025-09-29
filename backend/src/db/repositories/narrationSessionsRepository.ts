import type { Knex } from 'knex';

export interface NarrationSessionRecord {
  session_id: string;
  trip_id: string;
  profile_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  events: string;
  transcript_path: string | null;
  audio_cache_keys: string | null;
  created_at: string;
  updated_at: string;
}

export interface NarrationSessionCreate {
  sessionId: string;
  tripId: string;
  profileId: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'paused' | 'pending_deletion';
  startedAt?: string | null;
  completedAt?: string | null;
  events?: unknown[];
  transcriptPath?: string | null;
  audioCacheKeys?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface NarrationSessionUpdate {
  status?: 'scheduled' | 'in_progress' | 'completed' | 'paused' | 'pending_deletion';
  startedAt?: string | null;
  completedAt?: string | null;
  events?: unknown[];
  transcriptPath?: string | null;
  audioCacheKeys?: string[];
  updatedAt: string;
}

export class NarrationSessionsRepository {
  private readonly table = 'narration_sessions';

  constructor(private readonly db: Knex) {}

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

    await this.db<NarrationSessionRecord>(this.table).insert(record);
    return record;
  }

  async findActiveByTrip(tripId: string): Promise<NarrationSessionRecord[]> {
    return this.db<NarrationSessionRecord>(this.table)
      .where({ trip_id: tripId })
      .whereNotIn('status', ['completed', 'pending_deletion'])
      .orderBy('created_at', 'asc');
  }

  async update(sessionId: string, updates: NarrationSessionUpdate): Promise<void> {
    const payload: Partial<NarrationSessionRecord> = {
      updated_at: updates.updatedAt,
    };

    if (updates.status) {
      payload.status = updates.status;
    }
    if (updates.startedAt !== undefined) {
      payload.started_at = updates.startedAt;
    }
    if (updates.completedAt !== undefined) {
      payload.completed_at = updates.completedAt;
    }
    if (updates.events) {
      payload.events = JSON.stringify(updates.events);
    }
    if (updates.transcriptPath !== undefined) {
      payload.transcript_path = updates.transcriptPath;
    }
    if (updates.audioCacheKeys !== undefined) {
      payload.audio_cache_keys = updates.audioCacheKeys
        ? JSON.stringify(updates.audioCacheKeys)
        : null;
    }

    await this.db<NarrationSessionRecord>(this.table)
      .where({ session_id: sessionId })
      .update(payload);
  }

  async deleteByTripId(tripId: string): Promise<void> {
    await this.db<NarrationSessionRecord>(this.table).where({ trip_id: tripId }).update({
      status: 'pending_deletion',
      updated_at: new Date().toISOString(),
    });
  }
}
