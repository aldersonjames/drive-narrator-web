import type { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export interface TravelerProfileRecord {
  profile_id: string;
  display_name: string | null;
  home_location: string | null;
  interest_tags: string;
  assistant_voice_id: string;
  narration_voice_id: string;
  transcript_opt_in: number;
  consent_version: string;
  consent_accepted_at: string;
  retention_days: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deletion_request_id: string | null;
  metadata: string | null;
}

export interface TravelerProfileCreate {
  profileId: string;
  displayName?: string;
  homeLocation?: string;
  interestTags: string[];
  assistantVoiceId: string;
  narrationVoiceId: string;
  transcriptOptIn?: boolean;
  consentVersion: string;
  consentAcceptedAt: string;
  retentionDays?: number;
  metadata?: Record<string, unknown>;
}

export interface TravelerProfileUpdate {
  displayName?: string | null;
  homeLocation?: string | null;
  interestTags?: string[];
  assistantVoiceId?: string;
  narrationVoiceId?: string;
  transcriptOptIn?: boolean;
  retentionDays?: number;
  metadata?: Record<string, unknown> | null;
  updatedAt: string;
}

export class TravelerProfilesRepository {
  private readonly table = 'traveler_profiles';

  constructor(private readonly db: Knex) {}

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

    await this.db<TravelerProfileRecord>(this.table).insert(record);
    return record;
  }

  async findById(profileId: string): Promise<TravelerProfileRecord | undefined> {
    return this.db<TravelerProfileRecord>(this.table)
      .where({ profile_id: profileId, deleted_at: null })
      .first();
  }

  async update(
    profileId: string,
    changes: TravelerProfileUpdate,
  ): Promise<TravelerProfileRecord | undefined> {
    const updatePayload: Partial<TravelerProfileRecord> = {
      updated_at: changes.updatedAt,
    };

    if (changes.displayName !== undefined) {
      updatePayload.display_name = changes.displayName;
    }
    if (changes.homeLocation !== undefined) {
      updatePayload.home_location = changes.homeLocation;
    }
    if (changes.interestTags) {
      updatePayload.interest_tags = JSON.stringify(changes.interestTags);
    }
    if (changes.assistantVoiceId) {
      updatePayload.assistant_voice_id = changes.assistantVoiceId;
    }
    if (changes.narrationVoiceId) {
      updatePayload.narration_voice_id = changes.narrationVoiceId;
    }
    if (changes.transcriptOptIn !== undefined) {
      updatePayload.transcript_opt_in = changes.transcriptOptIn ? 1 : 0;
    }
    if (changes.retentionDays !== undefined) {
      updatePayload.retention_days = changes.retentionDays;
    }
    if (changes.metadata !== undefined) {
      updatePayload.metadata = changes.metadata ? JSON.stringify(changes.metadata) : null;
    }

    await this.db<TravelerProfileRecord>(this.table)
      .where({ profile_id: profileId, deleted_at: null })
      .update(updatePayload);

    return this.findById(profileId);
  }

  async softDelete(
    profileId: string,
    deletionRequestId: string = uuidv4(),
    deletedAt: string = new Date().toISOString(),
  ): Promise<void> {
    await this.db<TravelerProfileRecord>(this.table).where({ profile_id: profileId }).update({
      deleted_at: deletedAt,
      deletion_request_id: deletionRequestId,
      updated_at: deletedAt,
    });
  }
}
