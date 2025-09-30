import type {
  VoiceAdapter,
  VoiceAdapterConfig,
  VoiceAdapterSessionContext,
  VoiceSessionPayload,
} from '../../../types/voice';
import type { VoicePipelineConfig } from '../../../../../shared/types/tripNarrator';

export class ElevenLabsVoiceAdapter implements VoiceAdapter {
  private readonly config: VoiceAdapterConfig;

  constructor(config: VoiceAdapterConfig) {
    this.config = config;
  }

  async createSession(
    ctx: VoiceAdapterSessionContext,
  ): Promise<{ session: VoiceSessionPayload; pipeline: VoicePipelineConfig }> {
    if (!this.config.elevenLabs?.apiKey) {
      throw new Error('ElevenLabs API key is required for ElevenLabs adapter');
    }

    const issuedAtMs = Date.now();
    const expiresAtMs = issuedAtMs + this.config.sessionTtlSeconds * 1000;

    const session: VoiceSessionPayload = {
      provider: 'elevenlabs',
      transport: ctx.transport,
      ephemeralToken: 'elevenlabs-token-placeholder',
      model: 'elevenlabs-streaming',
      voice: {
        id: 'default',
        lang: 'en-US',
        rate: 1.0,
        style: 'narration',
      },
      features: {
        bargeIn: true,
        partials: true,
        ssml: true,
      },
      region: this.config.region,
      expiresAt: new Date(expiresAtMs).toISOString(),
      wakeWordEnabled: false,
      issuedAt: new Date(issuedAtMs).toISOString(),
      latencyHints: this.config.latencyHints,
      caps: this.config.caps,
    };

    const pipeline: VoicePipelineConfig = {
      asrProvider: this.config.asrProvider,
      ttsProvider: 'elevenlabs',
      narrationProvider: 'elevenlabs',
      metadata: {
        transport: ctx.transport,
        note: 'TODO: integrate ElevenLabs streaming session',
      },
    };

    return { session, pipeline };
  }
}
