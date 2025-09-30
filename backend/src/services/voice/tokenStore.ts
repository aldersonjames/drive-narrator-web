import type { VoiceTokenRecord, VoiceTokenStore } from '../../types/voice';

export class InMemoryVoiceTokenStore implements VoiceTokenStore {
  private readonly tokens = new Map<string, VoiceTokenRecord>();

  create(record: VoiceTokenRecord): void {
    this.tokens.set(record.token, record);
  }

  markUsed(token: string): void {
    const record = this.tokens.get(token);
    if (record) {
      record.used = true;
      this.tokens.set(token, record);
    }
  }

  isValid(token: string): boolean {
    const record = this.tokens.get(token);
    if (!record) {
      return false;
    }
    const now = Date.now();
    const expired = now > record.expiresAt;
    if (expired) {
      this.tokens.delete(token);
      return false;
    }
    return !record.used;
  }

  countActiveTokens(deviceId: string, since: number): number {
    let count = 0;
    const now = Date.now();
    for (const record of this.tokens.values()) {
      if (record.deviceId !== deviceId) {
        continue;
      }
      if (record.issuedAt >= since && record.expiresAt > now) {
        count += 1;
      }
    }
    return count;
  }

  purgeExpired(now: number = Date.now()): void {
    for (const [token, record] of this.tokens.entries()) {
      if (record.expiresAt <= now || record.used) {
        this.tokens.delete(token);
      }
    }
  }
}
