import type { Request, Response } from 'express';

import type { VoiceDefinition } from '../../../../shared/types/tripNarrator';
import { DEFAULT_VOICES } from '../../../../shared/data/voices';

export const createVoicesController = (voices: VoiceDefinition[] = DEFAULT_VOICES) => {
  return async function voicesController(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ voices });
  };
};
