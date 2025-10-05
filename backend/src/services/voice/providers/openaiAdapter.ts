import type {
  VoiceAdapter,
  VoiceAdapterConfig,
  VoiceAdapterSessionContext,
  VoiceSessionPayload,
} from '../../../types/voice';
import type { VoicePipelineConfig } from '../../../../../shared/types/tripNarrator';
import { NARRATOR_PERSONAS, DEFAULT_PERSONA_ID } from '../../../../../shared/data/narratorPersonas';

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

  private buildConversationInstructions(personaId?: string): string {
    // Lookup persona from shared data source
    const selectedPersonaId = personaId || DEFAULT_PERSONA_ID;
    const persona = NARRATOR_PERSONAS.find((p) => p.id === selectedPersonaId);

    if (!persona) {
      // Fallback to default persona if not found
      const defaultPersona = NARRATOR_PERSONAS.find((p) => p.id === DEFAULT_PERSONA_ID);
      if (defaultPersona) {
        return defaultPersona.conversationInstructions;
      }
      // Ultimate fallback if something is very wrong
      return `You are a helpful voice assistant for a road trip companion app. Keep responses concise and natural.`;
    }

    return persona.conversationInstructions;
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

    // Build conversation instructions based on persona
    // Following OpenAI Realtime Prompting Guide best practices
    const conversationInstructions = this.buildConversationInstructions(personaId);

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
