import crypto from 'node:crypto';

import type {
  TravelerProfileRecord,
  TravelerProfileUpdate,
} from '../../db/repositories/travelerProfilesRepository';
import type {
  PoiProviderId,
  PreferencesMetadata,
  PreferencesUpdatePayload,
} from '../../../../shared/types/tripNarrator';
import { DEFAULT_PERSONA_ID } from '../../../../shared/data/narratorPersonas';

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
  narrationPersonaId: string;
  interestTags: string[];
  transcriptOptIn: boolean;
  retentionDays: number;
  consentVersion: string;
  updatedAt: string;
  poiProvider: PoiProviderId;
  metadata: PreferencesMetadata | null;
}

export type PreferencesUpdateInput = PreferencesUpdatePayload;

export class PreferencesService {
  constructor(private readonly profilesRepo: TravelerProfilesGateway) {}

  async getPreferences(profileId: string): Promise<PreferencesDto | undefined> {
    const record = await this.profilesRepo.findById(profileId);
    if (!record) {
      return undefined;
    }

    const metadata = parseMetadata(record.metadata);
    const poiProvider: PoiProviderId = metadata.poiProvider === 'foursquare' ? 'foursquare' : 'ops';

    const narrationPersonaId =
      typeof metadata.narrationPersonaId === 'string' ? metadata.narrationPersonaId : DEFAULT_PERSONA_ID;

    return {
      profileId: record.profile_id,
      assistantVoiceId: record.assistant_voice_id,
      narrationVoiceId: record.narration_voice_id,
      narrationPersonaId,
      interestTags: JSON.parse(record.interest_tags ?? '[]'),
      transcriptOptIn: Boolean(record.transcript_opt_in),
      retentionDays: record.retention_days,
      consentVersion: record.consent_version,
      updatedAt: record.updated_at,
      poiProvider,
      metadata: Object.keys(metadata).length ? metadata : null,
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

    const shouldUpdateMetadata =
      update.metadata !== undefined || update.poiProvider !== undefined || update.narrationPersonaId !== undefined;
    if (shouldUpdateMetadata) {
      let nextMetadata: PreferencesMetadata = { ...metadata };

      if (update.metadata === null) {
        nextMetadata = {};
      } else if (update.metadata !== undefined) {
        nextMetadata = {
          ...metadata,
          ...update.metadata,
        };
      }

      if (update.poiProvider) {
        nextMetadata = {
          ...nextMetadata,
          poiProvider: update.poiProvider,
        };
      }

      if (update.narrationPersonaId) {
        nextMetadata = {
          ...nextMetadata,
          narrationPersonaId: update.narrationPersonaId,
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
