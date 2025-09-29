import type { Knex } from 'knex';

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

  // TODO: Implement persistence logic in later tasks
  async create(profile: TravelerProfileCreate): Promise<never> {
    void profile;
    throw new Error('TravelerProfilesRepository.create not implemented');
  }

  async findById(profileId: string): Promise<never> {
    void profileId;
    throw new Error('TravelerProfilesRepository.findById not implemented');
  }

  async update(profileId: string, changes: TravelerProfileUpdate): Promise<never> {
    void profileId;
    void changes;
    throw new Error('TravelerProfilesRepository.update not implemented');
  }

  async softDelete(
    profileId: string,
    deletionRequestId: string,
    deletedAt: string,
  ): Promise<never> {
    void profileId;
    void deletionRequestId;
    void deletedAt;
    throw new Error('TravelerProfilesRepository.softDelete not implemented');
  }
}
