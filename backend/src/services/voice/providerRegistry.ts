import type { VoiceAdapter, VoiceAdapterConfig } from '../../types/voice';
import type { VoiceProviderId } from '../../../../shared/types/tripNarrator';
import { OpenAiVoiceAdapter } from './providers/openaiAdapter';
import { ElevenLabsVoiceAdapter } from './providers/elevenLabsAdapter';

export interface ProviderRegistryOptions {
  config: VoiceAdapterConfig;
}

export class VoiceProviderRegistry {
  private readonly options: ProviderRegistryOptions;
  private readonly adapters = new Map<VoiceProviderId, VoiceAdapter>();

  constructor(options: ProviderRegistryOptions) {
    this.options = options;

    if (options.config.openAi?.apiKey) {
      this.adapters.set('openai', new OpenAiVoiceAdapter(options.config));
    }

    if (options.config.elevenLabs?.apiKey) {
      this.adapters.set('elevenlabs', new ElevenLabsVoiceAdapter(options.config));
    }
  }

  getAdapter(provider: VoiceProviderId): VoiceAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Voice provider ${provider} is not configured`);
    }
    return adapter;
  }
}
