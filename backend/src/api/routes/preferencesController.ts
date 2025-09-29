import type { Request, Response } from 'express';

import type {
  PreferencesService,
  PreferencesUpdateInput,
} from '../../services/preferences/preferencesService';
import type { PrivacyContext } from '../middleware/privacyMiddleware';
import { DEFAULT_VOICES } from './voicesController';

interface Dependencies {
  preferencesService: PreferencesService;
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

export const createPreferencesController = (deps: Dependencies) => {
  const validVoiceIds = new Set(DEFAULT_VOICES.map((voice) => voice.voiceId));

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

      return res.status(200).json(prefs);
    },
    patch: async (req: Request, res: Response): Promise<Response> => {
      const fallback =
        (typeof req.body?.profileId === 'string' && req.body.profileId) ||
        (typeof req.query.profileId === 'string' && req.query.profileId) ||
        undefined;
      const profileId = resolveProfileId(res, fallback);
      if (!profileId) {
        return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
      }

      if (req.body?.deleteProfile) {
        const deletionId = await deps.preferencesService.requestDeletion();
        return res.status(202).json({
          requestId: deletionId,
          status: 'pending-deletion',
          message: 'Profile deletion requested and queued.',
        });
      }

      const update: PreferencesUpdateInput = {};
      if (typeof req.body?.assistantVoiceId === 'string') {
        if (!validVoiceIds.has(req.body.assistantVoiceId)) {
          return res
            .status(400)
            .json({ code: 'INVALID_VOICE_SELECTION', message: 'Unknown assistant voice.' });
        }
        update.assistantVoiceId = req.body.assistantVoiceId;
      }
      if (typeof req.body?.narrationVoiceId === 'string') {
        if (!validVoiceIds.has(req.body.narrationVoiceId)) {
          return res
            .status(400)
            .json({ code: 'INVALID_VOICE_SELECTION', message: 'Unknown narration voice.' });
        }
        update.narrationVoiceId = req.body.narrationVoiceId;
      }
      const interests = normalizeArray(req.body?.interestTags);
      if (interests) {
        update.interestTags = interests;
      }
      if (typeof req.body?.transcriptOptIn === 'boolean') {
        update.transcriptOptIn = req.body.transcriptOptIn;
      }
      if (typeof req.body?.retentionDays === 'number') {
        update.retentionDays = req.body.retentionDays;
      }
      if (req.body?.metadata !== undefined) {
        update.metadata = req.body.metadata;
      }

      const prefs = await deps.preferencesService.updatePreferences(profileId, update);
      if (!prefs) {
        return res
          .status(404)
          .json({ code: 'PREFERENCES_NOT_FOUND', message: 'Preferences missing' });
      }

      return res.status(200).json(prefs);
    },
  };
};
