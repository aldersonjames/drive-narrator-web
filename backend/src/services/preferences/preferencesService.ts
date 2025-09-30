import crypto from 'node:crypto';

import type {
  TravelerProfileRecord,
  TravelerProfileUpdate,
} from '../../db/repositories/travelerProfilesRepository';
import type { PoiProviderId } from '../../../../shared/types/tripNarrator';

interface PreferencesMetadata {
  poiProvider?: PoiProviderId;
  [key: string]: unknown;
}

const parseMetadata = (raw: string | null): PreferencesMetadata => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as PreferencesMetadata;
    }
  } catch {
    // ignore malformed JSON and fall back to defaults
  }
  return {};
};

interface TravelerProfilesGateway {
  findById(profileId: string): Promise<TravelerProfileRecord | undefined>;
  update(
    profileId: string,
    changes: TravelerProfileUpdate,
  ): Promise<TravelerProfileRecord | undefined>;
}

export interface PreferencesDto {
  profileId: string;
  assistantVoiceId: string;
  narrationVoiceId: string;
  interestTags: string[];
  transcriptOptIn: boolean;
  retentionDays: number;
  consentVersion: string;
  updatedAt: string;
  poiProvider: PoiProviderId;
}

export interface PreferencesUpdateInput {
  assistantVoiceId?: string;
  narrationVoiceId?: string;
  interestTags?: string[];
  transcriptOptIn?: boolean;
  retentionDays?: number;
  metadata?: Record<string, unknown> | null;
  poiProvider?: PoiProviderId;
}

export class PreferencesService {
  constructor(private readonly profilesRepo: TravelerProfilesGateway) {}

  async getPreferences(profileId: string): Promise<PreferencesDto | undefined> {
    const record = await this.profilesRepo.findById(profileId);
    if (!record) {
      return undefined;
    }

    const metadata = parseMetadata(record.metadata);
    const poiProvider: PoiProviderId = metadata.poiProvider === 'foursquare' ? 'foursquare' : 'ops';

    return {
      profileId: record.profile_id,
      assistantVoiceId: record.assistant_voice_id,
      narrationVoiceId: record.narration_voice_id,
      interestTags: JSON.parse(record.interest_tags ?? '[]'),
      transcriptOptIn: Boolean(record.transcript_opt_in),
      retentionDays: record.retention_days,
      consentVersion: record.consent_version,
      updatedAt: record.updated_at,
      poiProvider,
    };
  }

  async updatePreferences(
    profileId: string,
    update: PreferencesUpdateInput,
  ): Promise<PreferencesDto | undefined> {
    const existing = await this.profilesRepo.findById(profileId);
    if (!existing) {
      return undefined;
    }

    const metadata = parseMetadata(existing.metadata);
    const now = new Date().toISOString();
    const changes: TravelerProfileUpdate = {
      assistantVoiceId: update.assistantVoiceId,
      narrationVoiceId: update.narrationVoiceId,
      interestTags: update.interestTags,
      transcriptOptIn: update.transcriptOptIn,
      retentionDays: update.retentionDays,
      updatedAt: now,
    };

    const shouldUpdateMetadata = update.metadata !== undefined || update.poiProvider !== undefined;
    if (shouldUpdateMetadata) {
      let nextMetadata: PreferencesMetadata =
        update.metadata !== undefined ? (update.metadata ?? {}) : { ...metadata };

      if (update.poiProvider) {
        nextMetadata = {
          ...nextMetadata,
          poiProvider: update.poiProvider,
        };
      }

      const entries = Object.keys(nextMetadata);
      changes.metadata = entries.length ? nextMetadata : null;
    }

    await this.profilesRepo.update(profileId, changes);

    return this.getPreferences(profileId);
  }

  async requestDeletion(): Promise<string> {
    const deletionId = crypto.randomUUID();
    return deletionId;
  }
}
