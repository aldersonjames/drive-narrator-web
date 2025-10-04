import type {
  VoiceAdapter,
  VoiceAdapterConfig,
  VoiceAdapterSessionContext,
  VoiceSessionPayload,
} from '../../../types/voice';
import type { VoicePipelineConfig } from '../../../../../shared/types/tripNarrator';

interface OpenAiRealtimeSessionResponse {
  id: string;
  expires_at?: number;
  client_secret?: {
    value: string;
    expires_at: number;
  };
}

const OPENAI_REALTIME_SESSION_URL = 'https://api.openai.com/v1/realtime/sessions';

export class OpenAiVoiceAdapter implements VoiceAdapter {
  private readonly config: VoiceAdapterConfig;

  constructor(config: VoiceAdapterConfig) {
    if (!config.openAi?.apiKey) {
      throw new Error('OpenAI API key is required for OpenAI voice adapter');
    }
    if (!config.openAi.model) {
      throw new Error('OpenAI model is required for OpenAI voice adapter');
    }
    this.config = config;
  }

  async createSession(
    ctx: VoiceAdapterSessionContext,
  ): Promise<{ session: VoiceSessionPayload; pipeline: VoicePipelineConfig }> {
    const { openAi, sessionTtlSeconds, latencyHints, caps } = this.config;
    if (!openAi) {
      throw new Error('OpenAI configuration missing');
    }

    // Apply voice preferences
    const voiceId = ctx.voicePreferences?.voiceId || openAi.voice;
    const personaId = ctx.voicePreferences?.personaId;
    const accentId = ctx.voicePreferences?.accentId;

    const response = await fetch(OPENAI_REALTIME_SESSION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAi.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: openAi.model,
        modalities: ['text', 'audio'],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to create OpenAI realtime session: ${text}`);
    }

    const json = (await response.json()) as OpenAiRealtimeSessionResponse;
    const ephemeralSecret = json.client_secret?.value;
    const expiresAt = json.client_secret?.expires_at ?? json.expires_at;

    if (!ephemeralSecret) {
      throw new Error('OpenAI realtime session did not return a client secret');
    }

    const issuedAtMs = Date.now();
    const ttlMs = sessionTtlSeconds * 1000;
    const expiresAtMs = expiresAt ? expiresAt * 1000 : issuedAtMs + ttlMs;

    // Build conversation instructions based on persona and accent
    let conversationInstructions =
      'You are a helpful voice assistant for a road trip companion app. Keep responses concise and natural.';

    if (personaId) {
      // TODO: Load persona instructions from shared data
      conversationInstructions += `\n\nPersona: ${personaId}`;
    }

    if (accentId) {
      // TODO: Load accent instructions from shared data
      conversationInstructions += `\n\nAccent: ${accentId}`;
    }

    const session: VoiceSessionPayload = {
      provider: 'openai',
      transport: ctx.transport,
      ephemeralToken: ephemeralSecret,
      model: openAi.model,
      voice: {
        id: voiceId,
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
      latencyHints,
      caps,
      conversationInstructions, // Add conversation instructions
    };

    const pipeline: VoicePipelineConfig = {
      asrProvider: 'openai',
      ttsProvider: 'openai',
      narrationProvider: this.config.narrationProvider,
      metadata: {
        transport: ctx.transport,
        model: openAi.model,
      },
    };

    return { session, pipeline };
  }
}
