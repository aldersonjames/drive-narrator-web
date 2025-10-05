import type { VoiceDefinition } from '../types/tripNarrator';

/**
 * Canonical list of available voices for the Drive Narrator application.
 * This is the single source of truth for voice options across frontend and backend.
 *
 * NOTE: Only using 3 voices compatible with OpenAI Realtime API
 */
export const DEFAULT_VOICES: VoiceDefinition[] = [
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
    voiceId: 'shimmer',
    provider: 'openai',
    displayName: 'Shimmer',
    locale: 'en-US',
    styleTags: ['playful', 'youthful'],
  },
];

/**
 * Get the default voice ID for the application
 */
export const DEFAULT_VOICE_ID = 'alloy';
