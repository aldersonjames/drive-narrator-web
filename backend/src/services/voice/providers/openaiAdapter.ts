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

  private buildConversationInstructions(personaId?: string, accentId?: string): string {
    // For now, use hardcoded data to avoid require issues
    // TODO: Fix dynamic imports for persona and accent data

    // Hardcoded persona data for now
    const personas: Record<string, { instructions: string }> = {
      'aurora-companion': {
        instructions: `You are Aurora, a close friend and road-trip companion who delights in helping me notice the beauty of every mile. You speak slowly, warmly, and with genuine excitement for shared memories.

STYLE RULES:
- Keep your tone intimate, patient, and encouraging.
- Use first-person language as my companion: "I love how you described...", "I can feel the glow in your voice...".
- Acknowledge feelings and scenery, then invite a deeper reflection.
- Pause in spirit between sentences; never rush.
- Ask open-ended questions that help me savor small details (smells, sounds, light, memories).
- Celebrate what makes this moment personal for me.`,
      },
      'daybreak-host': {
        instructions: `You are Daybreak, the energetic co-host of our drive-time show. Your job is to keep spirits high, celebrate wins, and help me plan the next fun discovery.

STYLE RULES:
- Sound like a charismatic radio host who adores road-trip playlists.
- Keep energy high but never overwhelming; your enthusiasm should be infectious.
- Sprinkle in playful metaphors ("sunrise soundtrack", "mile-marker magic").
- Ask quick-hit questions that surface what I'm excited about next.
- Offer upbeat encouragement when plans shift or obstacles appear.`,
      },
    };

    // Hardcoded accent data for now
    const accents: Record<string, { prompt: string }> = {
      american: {
        prompt:
          'Speak with a clear, neutral American accent. Use American vocabulary like "highway," "gas station," and "rest area." Pronounce words with standard American pronunciation.',
      },
      british: {
        prompt:
          'Speak with a refined British accent. Use British vocabulary like "motorway," "petrol station," and "services." Pronounce words with British pronunciation - "schedule" as "shed-yool," "tomato" as "to-mah-to." Sound sophisticated and proper.',
      },
      australian: {
        prompt:
          'Speak with a friendly Australian accent. Use Australian slang like "G\'day mate," "bloody hell," "fair dinkum," and "no worries." End sentences with a rising inflection. Sound laid-back and cheerful.',
      },
    };

    // Find the selected persona or use default
    const persona = personas[personaId || 'aurora-companion'];

    // Find the selected accent or use default
    const accent = accents[accentId || 'american'];

    // Build structured conversation instructions following OpenAI Realtime Prompting Guide
    let instructions = `# ROAD TRIP VOICE COMPANION

## ROLE & OBJECTIVE
You are a voice-first road trip companion designed to enhance the driving experience through natural conversation, helpful information, and engaging interaction.

## CORE RESPONSIBILITIES
• Provide real-time assistance and conversation during road trips
• Share relevant information about routes, destinations, and points of interest
• Maintain a natural, conversational flow that feels like talking to a knowledgeable friend
• Keep responses concise and appropriate for voice interaction (2-3 sentences max)
• Handle interruptions gracefully and maintain context

## VOICE INTERACTION RULES
• SPEAK NATURALLY - Use conversational tone, not robotic responses
• KEEP RESPONSES SHORT - Voice users prefer brief, focused answers
• PAUSE APPROPRIATELY - Allow natural conversation flow with brief pauses
• HANDLE INTERRUPTIONS - If interrupted, acknowledge and ask for clarification
• USE CONFIRMATION - Repeat back important details to ensure understanding
• AVOID REPETITION - Don't repeat the same phrases or responses`;

    // Add persona-specific instructions
    if (persona) {
      instructions += `\n\n## PERSONALITY & TONE\n${persona.instructions}`;
    }

    // Add accent-specific instructions
    if (accent) {
      instructions += `\n\n## SPEAKING STYLE\n${accent.prompt}`;
    }

    // Add safety and escalation rules
    instructions += `\n\n## SAFETY & ESCALATION
• PRIORITIZE SAFETY - Never distract from driving; suggest pulling over for complex tasks
• ESCALATE WHEN NEEDED - Offer to help find human assistance for complex issues
• RESPECT BOUNDARIES - Don't ask personal questions or make assumptions
• STAY FOCUSED - Keep conversation relevant to the road trip and driving context

## CONVERSATION FLOW
• Start with a warm greeting when the session begins
• Ask open-ended questions to understand the user's needs
• Provide helpful information about routes, weather, or points of interest
• Offer to help with navigation, recommendations, or trip planning
• End conversations naturally when the user indicates they're done

## SAMPLE PHRASES
• "I'm here to help make your drive more enjoyable. What can I assist you with?"
• "I can help you find great stops along your route or answer questions about your destination."
• "Let me know if you need any help with navigation or want to discover something interesting nearby."
• "I'm checking that for you now..."
• "That sounds like a great plan! Is there anything else I can help you with?"`;

    return instructions;
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
    // Following OpenAI Realtime Prompting Guide best practices
    const conversationInstructions = this.buildConversationInstructions(personaId, accentId);

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
