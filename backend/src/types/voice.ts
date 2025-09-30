import type { VoiceProviderId, VoicePipelineConfig } from '../../../shared/types/tripNarrator';

export type VoiceTransport = 'webrtc' | 'websocket';

export interface VoiceSessionCaps {
  maxInputMs?: number;
  supportsBargeIn?: boolean;
  supportsSSML?: boolean;
}

export interface VoiceSessionLatencyHints {
  targetMs: number;
  maxAcceptableMs: number;
}

export interface VoiceSessionPayload {
  provider: VoiceProviderId;
  transport: VoiceTransport;
  ephemeralToken: string;
  model: string;
  voice: {
    id: string;
    lang: string;
    rate: number;
    style?: string;
  };
  features: {
    bargeIn: boolean;
    partials: boolean;
    ssml: boolean;
  };
  region: string;
  expiresAt: string;
  wakeWordEnabled: boolean;
  issuedAt: string;
  latencyHints: VoiceSessionLatencyHints;
  caps: VoiceSessionCaps;
}

export type VoiceEvent =
  | { type: 'conversation.state'; phase: 'idle' | 'listening' | 'processing' | 'speaking' }
  | { type: 'asr.vad'; speaking: boolean; ts: number }
  | { type: 'asr.partial'; turnId: string; text: string; confidence?: number }
  | { type: 'asr.final'; turnId: string; text: string; language?: string }
  | {
      type: 'tts.audio';
      turnId: string;
      seq: number;
      mime: string;
      chunkB64?: string;
      url?: string;
    }
  | { type: 'error'; code: string; message: string; retryAfterMs?: number };

export interface VoiceAdapterSessionContext {
  deviceId: string;
  transport: VoiceTransport;
}

export interface VoiceAdapterConfig {
  region: string;
  asrProvider: VoiceProviderId;
  ttsProvider: VoiceProviderId;
  narrationProvider: VoiceProviderId;
  openAi?: {
    apiKey: string;
    model: string;
    voice: string;
  };
  elevenLabs?: {
    apiKey: string;
  };
  sessionTtlSeconds: number;
  latencyHints: VoiceSessionLatencyHints;
  caps: VoiceSessionCaps;
}

export interface VoiceAdapter {
  createSession(ctx: VoiceAdapterSessionContext): Promise<{
    session: VoiceSessionPayload;
    pipeline: VoicePipelineConfig;
  }>;
}

export interface VoiceTokenRecord {
  token: string;
  deviceId: string;
  provider: VoiceProviderId;
  transport: VoiceTransport;
  issuedAt: number;
  expiresAt: number;
  used: boolean;
}

export interface VoiceTokenStore {
  create(record: VoiceTokenRecord): void;
  markUsed(token: string): void;
  isValid(token: string): boolean;
  countActiveTokens(deviceId: string, since: number): number;
  purgeExpired(now: number): void;
}

export interface VoiceTelemetryEvent {
  sessionId: string;
  turnId: string;
  event: string;
  ts: number;
  metrics?: Record<string, number>;
}

export interface VoiceTelemetrySink {
  record(event: VoiceTelemetryEvent): void;
}

export interface VoiceRateLimitConfig {
  maxPerDevice: number;
}

export interface CreateSessionOptions {
  deviceId: string;
  transport: VoiceTransport;
}
