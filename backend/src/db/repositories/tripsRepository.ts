import type { Knex } from 'knex';

export interface DriveRecord {
  drive_id: string;
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

export interface DriveCreate {
  driveId: string;
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

export interface DriveUpdate {
  status?: 'draft' | 'planned' | 'completed' | 'archived' | 'pending_deletion';
  interestTags?: string[];
  departureTime?: string;
  lastAccessedAt?: string | null;
  updatedAt: string;
}

export class DrivesRepository {
  private readonly table = 'drives';

  constructor(private readonly db: Knex) {}

  async create(drive: DriveCreate): Promise<DriveRecord> {
    const now = new Date().toISOString();
    const record: DriveRecord = {
      drive_id: drive.driveId,
      profile_id: drive.profileId,
      origin_raw: drive.originRaw,
      origin_hash: drive.originHash,
      destination_raw: drive.destinationRaw,
      destination_hash: drive.destinationHash,
      departure_time: drive.departureTime,
      interest_tags: JSON.stringify(drive.interestTags),
      status: drive.status ?? 'draft',
      created_at: drive.createdAt ?? now,
      updated_at: drive.updatedAt ?? now,
      last_accessed_at: drive.lastAccessedAt ?? null,
    };

    await this.db<DriveRecord>(this.table).insert(record);
    return record;
  }

  async findById(driveId: string): Promise<DriveRecord | undefined> {
    return this.db<DriveRecord>(this.table).where({ drive_id: driveId }).first();
  }

  async findActiveByProfile(profileId: string): Promise<DriveRecord[]> {
    return this.db<DriveRecord>(this.table)
      .where({ profile_id: profileId })
      .whereNotIn('status', ['archived', 'pending_deletion'])
      .orderBy('updated_at', 'desc');
  }

  async update(driveId: string, changes: DriveUpdate): Promise<void> {
    const updatePayload: Partial<DriveRecord> = {
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

    await this.db<DriveRecord>(this.table).where({ drive_id: driveId }).update(updatePayload);
  }
}
