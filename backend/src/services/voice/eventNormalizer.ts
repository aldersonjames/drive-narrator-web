import type { VoiceEvent } from '../../types/voice';
import type { ConversationAudioSegment } from '../../../../shared/types/tripNarrator';

export interface ProviderEventPayload {
  type: string;
  [key: string]: unknown;
}

export const normalizeAudioSegment = (
  turnId: string,
  segment: ConversationAudioSegment,
  index: number,
): VoiceEvent => {
  return {
    type: 'tts.audio',
    turnId,
    seq: index + 1,
    mime: (segment.metadata?.mimeType as string | undefined) ?? 'audio/mpeg',
    chunkB64: segment.metadata?.chunkB64 as string | undefined,
    url: segment.metadata?.url as string | undefined,
  };
};

export const normalizeError = (code: string, message: string): VoiceEvent => ({
  type: 'error',
  code,
  message,
});

export const normalizeConversationState = (
  phase: 'idle' | 'listening' | 'processing' | 'speaking',
): VoiceEvent => ({
  type: 'conversation.state',
  phase,
});
