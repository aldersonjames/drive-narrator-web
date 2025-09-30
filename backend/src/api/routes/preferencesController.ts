import type { Request, Response } from 'express';
import { z } from 'zod';

import type {
  PreferencesService,
  PreferencesUpdateInput,
} from '../../services/preferences/preferencesService';
import type { PrivacyContext } from '../middleware/privacyMiddleware';
import { DEFAULT_VOICES } from './voicesController';
import type { PoiProviderId, ProviderCapabilityMap } from '../../../../shared/types/tripNarrator';
import { validate } from '../../utils/validation';
import type { DeletionService } from '../../services/privacy/deletionService';

interface Dependencies {
  preferencesService: PreferencesService;
  poiProvider: { isFoursquareEnabled(): boolean };
  deletionService: DeletionService;
}

const normalizeArray = (value: unknown): string[] | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === 'string')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
  }
  return undefined;
};

const preferencesPatchSchema = z
  .object({
    profileId: z.string().optional(),
    assistantVoiceId: z.string().optional(),
    narrationVoiceId: z.string().optional(),
    interestTags: z.union([z.array(z.string()), z.string()]).optional(),
    transcriptOptIn: z.boolean().optional(),
    retentionDays: z.number().int().positive().max(365).optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
    deleteProfile: z.boolean().optional(),
    poiProvider: z.string().optional(),
  })
  .strict();

export const createPreferencesController = (deps: Dependencies) => {
  const validVoiceIds = new Set(DEFAULT_VOICES.map((voice) => voice.voiceId));

  const buildProviderCapabilities = (): ProviderCapabilityMap => {
    const foursquareAvailable = deps.poiProvider.isFoursquareEnabled();
    return {
      ops: {
        available: true,
        locked: false,
        label: 'Open POI Service',
        description: 'Open data via OpenPoiService (OPS) with curated taxonomy mapping.',
      },
      foursquare: {
        available: foursquareAvailable,
        locked: !foursquareAvailable,
        label: 'Foursquare Places',
        description: foursquareAvailable
          ? 'Enriched ratings and imagery from Foursquare Places.'
          : 'Add a Foursquare API key to unlock premium POI metadata.',
      },
    };
  };

  const enforceProviderSelection = (requested: PoiProviderId): PoiProviderId => {
    if (requested === 'foursquare' && !deps.poiProvider.isFoursquareEnabled()) {
      return 'ops';
    }
    return requested;
  };

  const resolveProfileId = (res: Response, fallback?: string): string | undefined => {
    const locals = res.locals as { privacy?: PrivacyContext };
    return locals?.privacy?.profileId ?? fallback;
  };

  return {
    get: async (req: Request, res: Response): Promise<Response> => {
      const profileId = resolveProfileId(
        res,
        typeof req.query.profileId === 'string' ? req.query.profileId : undefined,
      );
      if (!profileId) {
        return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
      }

      const prefs = await deps.preferencesService.getPreferences(profileId);
      if (!prefs) {
        return res
          .status(404)
          .json({ code: 'PREFERENCES_NOT_FOUND', message: 'Preferences missing' });
      }

      const providerCapabilities = buildProviderCapabilities();
      const effectiveProvider = enforceProviderSelection(prefs.poiProvider);

      return res.status(200).json({
        ...prefs,
        poiProvider: effectiveProvider,
        providerCapabilities,
      });
    },
    patch: async (req: Request, res: Response): Promise<Response> => {
      const payload = validate(preferencesPatchSchema, req.body ?? {});
      const fallback =
        (typeof payload?.profileId === 'string' && payload.profileId) ||
        (typeof req.query.profileId === 'string' && req.query.profileId) ||
        undefined;
      const profileId = resolveProfileId(res, fallback);
      if (!profileId) {
        return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
      }

      if (payload.deleteProfile) {
        const result = await deps.deletionService.enqueueProfileDeletion(profileId);
        return res.status(202).json({
          requestId: result.requestId,
          status: 'pending-deletion',
          message: 'Profile deletion requested and queued.',
          tripCount: result.tripCount,
        });
      }

      const update: PreferencesUpdateInput = {};
      if (typeof payload.assistantVoiceId === 'string') {
        if (!validVoiceIds.has(payload.assistantVoiceId)) {
          return res
            .status(400)
            .json({ code: 'INVALID_VOICE_SELECTION', message: 'Unknown assistant voice.' });
        }
        update.assistantVoiceId = payload.assistantVoiceId;
      }
      if (typeof payload.narrationVoiceId === 'string') {
        if (!validVoiceIds.has(payload.narrationVoiceId)) {
          return res
            .status(400)
            .json({ code: 'INVALID_VOICE_SELECTION', message: 'Unknown narration voice.' });
        }
        update.narrationVoiceId = payload.narrationVoiceId;
      }
      const interests = normalizeArray(payload?.interestTags);
      if (interests) {
        update.interestTags = interests;
      }
      if (typeof payload.transcriptOptIn === 'boolean') {
        update.transcriptOptIn = payload.transcriptOptIn;
      }
      if (typeof payload.retentionDays === 'number') {
        update.retentionDays = payload.retentionDays;
      }
      if (payload.metadata !== undefined) {
        update.metadata = payload.metadata;
      }

      if (typeof payload.poiProvider === 'string') {
        const requested = payload.poiProvider as PoiProviderId;
        if (!['ops', 'foursquare'].includes(requested)) {
          return res
            .status(400)
            .json({ code: 'INVALID_PROVIDER_SELECTION', message: 'Unknown POI provider.' });
        }
        if (requested === 'foursquare' && !deps.poiProvider.isFoursquareEnabled()) {
          return res.status(423).json({
            code: 'PROVIDER_LOCKED',
            message: 'Foursquare provider is locked until API credentials are configured.',
          });
        }
        update.poiProvider = requested;
      }

      const prefs = await deps.preferencesService.updatePreferences(profileId, update);
      if (!prefs) {
        return res
          .status(404)
          .json({ code: 'PREFERENCES_NOT_FOUND', message: 'Preferences missing' });
      }

      const providerCapabilities = buildProviderCapabilities();
      const effectiveProvider = enforceProviderSelection(prefs.poiProvider);

      return res.status(200).json({
        ...prefs,
        poiProvider: effectiveProvider,
        providerCapabilities,
      });
    },
  };
};
