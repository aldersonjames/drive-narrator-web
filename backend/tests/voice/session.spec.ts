import { jest } from '@jest/globals';

import { VoicePipelineService } from '../../src/services/voice/voicePipelineService';
import { InMemoryVoiceTokenStore } from '../../src/services/voice/tokenStore';
import type { VoiceAdapterConfig } from '../../src/types/voice';

const mockFetch = jest.spyOn(global, 'fetch');

describe('VoicePipelineService', () => {
  const baseConfig: VoiceAdapterConfig = {
    region: 'iad',
    asrProvider: 'openai',
    ttsProvider: 'openai',
    narrationProvider: 'openai',
    openAi: {
      apiKey: 'sk-test',
      model: 'gpt-4o-realtime-preview',
      voice: 'alloy',
    },
    sessionTtlSeconds: 300,
    latencyHints: {
      targetMs: 350,
      maxAcceptableMs: 1200,
    },
    caps: {
      maxInputMs: 15000,
      supportsBargeIn: true,
      supportsSSML: true,
    },
  };

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        client_secret: {
          value: 'ephemeral-token',
          expires_at: Math.floor(Date.now() / 1000) + 60,
        },
      }),
    } as unknown as Response);
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it('issues a session payload', async () => {
    const service = new VoicePipelineService({
      adapterConfig: baseConfig,
      rateLimit: { maxPerDevice: 4 },
      tokenStore: new InMemoryVoiceTokenStore(),
    });

    const { session } = await service.createSession({ deviceId: 'device-1', transport: 'webrtc' });

    expect(session.provider).toBe('openai');
    expect(session.transport).toBe('webrtc');
    expect(session.ephemeralToken).toBe('ephemeral-token');
    expect(session.features.bargeIn).toBe(true);
    expect(session.latencyHints.targetMs).toBe(350);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('enforces per-device rate limit', async () => {
    const service = new VoicePipelineService({
      adapterConfig: baseConfig,
      rateLimit: { maxPerDevice: 1 },
      tokenStore: new InMemoryVoiceTokenStore(),
    });

    await service.createSession({ deviceId: 'device-2', transport: 'webrtc' });

    await expect(async () => {
      await service.createSession({ deviceId: 'device-2', transport: 'webrtc' });
    }).rejects.toThrow('VOICE_RATE_LIMIT_EXCEEDED');
  });
});
