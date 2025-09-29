import crypto from 'node:crypto';

import type { TravelerProfilesRepository } from '../../db/repositories/travelerProfilesRepository';

export interface PreferencesDto {
  profileId: string;
  assistantVoiceId: string;
  narrationVoiceId: string;
  interestTags: string[];
  transcriptOptIn: boolean;
  consentVersion: string;
  updatedAt: string;
}

export interface PreferencesUpdateInput {
  assistantVoiceId?: string;
  narrationVoiceId?: string;
  interestTags?: string[];
  transcriptOptIn?: boolean;
  retentionDays?: number;
  metadata?: Record<string, unknown> | null;
}

export class PreferencesService {
  constructor(private readonly profilesRepo: TravelerProfilesRepository) {}

  async getPreferences(profileId: string): Promise<PreferencesDto | undefined> {
    const record = await this.profilesRepo.findById(profileId);
    if (!record) {
      return undefined;
    }

    return {
      profileId: record.profile_id,
      assistantVoiceId: record.assistant_voice_id,
      narrationVoiceId: record.narration_voice_id,
      interestTags: JSON.parse(record.interest_tags ?? '[]'),
      transcriptOptIn: Boolean(record.transcript_opt_in),
      consentVersion: record.consent_version,
      updatedAt: record.updated_at,
    };
  }

  async updatePreferences(
    profileId: string,
    update: PreferencesUpdateInput,
  ): Promise<PreferencesDto | undefined> {
    const now = new Date().toISOString();
    await this.profilesRepo.update(profileId, {
      assistantVoiceId: update.assistantVoiceId,
      narrationVoiceId: update.narrationVoiceId,
      interestTags: update.interestTags,
      transcriptOptIn: update.transcriptOptIn,
      retentionDays: update.retentionDays,
      metadata: update.metadata,
      updatedAt: now,
    });

    return this.getPreferences(profileId);
  }

  async requestDeletion(): Promise<string> {
    const deletionId = crypto.randomUUID();
    return deletionId;
  }
}
