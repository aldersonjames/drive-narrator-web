export interface CacheStore<T> {
  get(key: string): T | undefined;
  set(key: string, value: T, ttlMs?: number): void;
  delete(key: string): void;
  clear(): void;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache<T> implements CacheStore<T> {
  private readonly store = new Map<string, Entry<T>>();

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs ?? this.defaultTtlMs;
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const createInMemoryCache = <T>(options?: { ttlMs?: number }): InMemoryCache<T> => {
  const ttl = options?.ttlMs ?? Number(process.env.DEFAULT_CACHE_TTL_MS ?? 300_000);
  return new InMemoryCache<T>(ttl);
};
