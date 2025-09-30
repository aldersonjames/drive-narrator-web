import type {
  CreateSessionOptions,
  VoiceAdapterConfig,
  VoiceRateLimitConfig,
  VoiceTokenStore,
} from '../../types/voice';
import type { VoiceProviderId, VoicePipelineConfig } from '../../../../shared/types/tripNarrator';
import { VoiceProviderRegistry } from './providerRegistry';
import type { VoiceSessionPayload } from '../../types/voice';

export interface VoicePipelineServiceConfig {
  adapterConfig: VoiceAdapterConfig;
  rateLimit: VoiceRateLimitConfig;
  tokenStore: VoiceTokenStore;
}

export interface VoiceSessionResponse {
  session: VoiceSessionPayload;
  pipeline: VoicePipelineConfig;
  token: string;
}

export class VoicePipelineService {
  private readonly registry: VoiceProviderRegistry;
  private readonly rateLimit: VoiceRateLimitConfig;
  private readonly tokenStore: VoiceTokenStore;
  private readonly sessionTtlSeconds: number;
  private readonly providerConfig: VoiceAdapterConfig;

  constructor(config: VoicePipelineServiceConfig) {
    this.registry = new VoiceProviderRegistry({ config: config.adapterConfig });
    this.rateLimit = config.rateLimit;
    this.tokenStore = config.tokenStore;
    this.sessionTtlSeconds = config.adapterConfig.sessionTtlSeconds;
    this.providerConfig = config.adapterConfig;
  }

  createSession(options: CreateSessionOptions): Promise<VoiceSessionResponse> {
    this.enforceRateLimit(options.deviceId);

    const adapter = this.registry.getAdapter(this.providerConfig.asrProvider);
    return adapter
      .createSession({
        deviceId: options.deviceId,
        transport: options.transport,
      })
      .then(({ session, pipeline }) => {
        const token = session.ephemeralToken;
        const issuedAtMs = Date.now();
        const expiresAtMs = issuedAtMs + this.sessionTtlSeconds * 1000;

        this.tokenStore.create({
          token,
          deviceId: options.deviceId,
          provider: this.providerConfig.asrProvider as VoiceProviderId,
          transport: session.transport,
          issuedAt: issuedAtMs,
          expiresAt: expiresAtMs,
          used: false,
        });

        return {
          session,
          pipeline,
          token,
        };
      });
  }

  markTokenUsed(token: string): void {
    this.tokenStore.markUsed(token);
  }

  private enforceRateLimit(deviceId: string): void {
    const now = Date.now();
    const windowStart = now - this.sessionTtlSeconds * 1000;
    this.tokenStore.purgeExpired(now);
    const active = this.tokenStore.countActiveTokens(deviceId, windowStart);
    if (active >= this.rateLimit.maxPerDevice) {
      throw new Error('VOICE_RATE_LIMIT_EXCEEDED');
    }
  }
}
