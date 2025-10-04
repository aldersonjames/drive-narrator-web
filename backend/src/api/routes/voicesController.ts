import type { Request, Response } from 'express';

import type { VoiceDefinition } from '../../../../shared/types/tripNarrator';

export const DEFAULT_VOICES: VoiceDefinition[] = [
  {
    voiceId: 'assistant-default',
    provider: 'openai',
    displayName: 'Assistant Default',
    locale: 'en-US',
    styleTags: ['assistant', 'neutral'],
  },
  {
    voiceId: 'alloy',
    provider: 'openai',
    displayName: 'Alloy',
    locale: 'en-US',
    styleTags: ['balanced', 'friendly'],
  },
  {
    voiceId: 'echo',
    provider: 'openai',
    displayName: 'Echo',
    locale: 'en-US',
    styleTags: ['clear', 'direct'],
  },
  {
    voiceId: 'fable',
    provider: 'openai',
    displayName: 'Fable',
    locale: 'en-US',
    styleTags: ['storytelling', 'expressive'],
  },
  {
    voiceId: 'onyx',
    provider: 'openai',
    displayName: 'Onyx',
    locale: 'en-US',
    styleTags: ['calm', 'deep'],
  },
  {
    voiceId: 'nova',
    provider: 'openai',
    displayName: 'Nova',
    locale: 'en-US',
    styleTags: ['warm', 'enthusiastic'],
  },
  {
    voiceId: 'shimmer',
    provider: 'openai',
    displayName: 'Shimmer',
    locale: 'en-US',
    styleTags: ['playful', 'youthful'],
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
  {
    voiceId: 'assistant-calm',
    provider: 'openai',
    displayName: 'Assistant Calm',
    locale: 'en-US',
    styleTags: ['assistant', 'calm'],
  },
  {
    voiceId: 'assistant-serene',
    provider: 'openai',
    displayName: 'Assistant Serene',
    locale: 'en-US',
    styleTags: ['assistant', 'serene'],
  },
  {
    voiceId: 'narrator-story',
    provider: 'openai',
    displayName: 'Narrator Story',
    locale: 'en-US',
    styleTags: ['storytelling', 'expressive'],
  },
  {
    voiceId: 'narrator-storyteller',
    provider: 'openai',
    displayName: 'Narrator Storyteller',
    locale: 'en-US',
    styleTags: ['storytelling', 'lively'],
  },
];

export const createVoicesController = (voices: VoiceDefinition[] = DEFAULT_VOICES) => {
  return async function voicesController(_req: Request, res: Response): Promise<Response> {
    return res.status(200).json({ voices });
  };
};
