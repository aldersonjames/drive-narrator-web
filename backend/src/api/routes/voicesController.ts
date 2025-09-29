import type { Request, Response } from 'express';

import type { VoiceDefinition } from '../../../shared/types/tripNarrator';

const DEFAULT_VOICES: VoiceDefinition[] = [
  {
    voiceId: 'assistant-default',
    provider: 'openai',
    displayName: 'Assistant Default',
    locale: 'en-US',
    styleTags: ['assistant', 'neutral'],
  },
  {
    voiceId: 'narrator-default',
    provider: 'openai',
    displayName: 'Narrator Default',
    locale: 'en-US',
    styleTags: ['storytelling', 'warm'],
  },
  {
    voiceId: 'narrator-serene',
    provider: 'openai',
    displayName: 'Serene Narrator',
    locale: 'en-US',
    styleTags: ['calm', 'soothing'],
  },
];

export const createVoicesController = (voices: VoiceDefinition[] = DEFAULT_VOICES) => {
  return async function voicesController(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ voices });
  };
};
