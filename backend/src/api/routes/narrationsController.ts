import crypto from 'node:crypto';
import type { Request, Response } from 'express';

import type { PreferencesService } from '../../services/preferences/preferencesService';
import type { PrivacyContext } from '../middleware/privacyMiddleware';

interface Dependencies {
  preferencesService: PreferencesService;
}

export const createNarrationsController = (deps: Dependencies) => {
  return async function narrationsController(req: Request, res: Response): Promise<Response> {
    const locals = res.locals as { privacy?: PrivacyContext };
    const profileId = locals?.privacy?.profileId;

    if (!profileId) {
      return res
        .status(403)
        .json({ code: 'PROFILE_REQUIRED', message: 'Traveler profile identifier is required.' });
    }

    const preferences = await deps.preferencesService.getPreferences(profileId);
    const narrationVoice = preferences?.narrationVoiceId ?? 'narrator-default';

    const narrationId = crypto.randomUUID();
    const tripId = typeof req.body?.tripId === 'string' ? req.body.tripId : 'trip';
    const transcriptPath = `transcripts/${profileId}/${tripId}-${Date.now()}.txt`;

    return res.status(201).json({
      narrationId,
      voice: narrationVoice,
      transcriptPath,
    });
  };
};
