import type { Request, Response } from 'express';

import type {
  PreferencesService,
  PreferencesUpdateInput,
} from '../../services/preferences/preferencesService';

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
  return {
    get: async (req: Request, res: Response): Promise<Response> => {
      const profileId = req.query.profileId;
      if (!profileId || typeof profileId !== 'string') {
        return res
          .status(400)
          .json({ code: 'INVALID_REQUEST', message: 'profileId query parameter is required' });
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
      const profileId = req.body?.profileId ?? req.query.profileId;
      if (!profileId || typeof profileId !== 'string') {
        return res
          .status(400)
          .json({ code: 'INVALID_REQUEST', message: 'profileId is required in body or query' });
      }

      const update: PreferencesUpdateInput = {};
      if (typeof req.body?.assistantVoiceId === 'string') {
        update.assistantVoiceId = req.body.assistantVoiceId;
      }
      if (typeof req.body?.narrationVoiceId === 'string') {
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
