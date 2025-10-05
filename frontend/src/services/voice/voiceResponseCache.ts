/**
 * Voice Response Cache Service
 * Caches common voice responses to reduce API calls and improve latency
 */

export interface CachedResponse {
  id: string;
  requestKey: string; // Hash of request parameters
  audioData: ArrayBuffer;
  transcript: string;
  voiceId: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // bytes
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

// Reserved for future localStorage usage
// const CACHE_KEY_PREFIX = 'drive_narrator_voice_cache_';
// const CACHE_INDEX_KEY = 'drive_narrator_voice_cache_index';

const MAX_CACHE_SIZE_MB = 50; // Maximum cache size in megabytes
const MAX_CACHE_AGE_DAYS = 7; // Maximum age of cached entries
const MAX_ENTRIES = 100; // Maximum number of cached entries

export class VoiceResponseCacheService {
  private hitCount = 0;
  private missCount = 0;
  private indexedDB: IDBDatabase | null = null;
  private memoryCache: Map<string, CachedResponse> = new Map();
  private useIndexedDB = true;

  constructor() {
    this.initializeIndexedDB();
  }

  /**
   * Initialize IndexedDB for larger cache storage
   */
  private async initializeIndexedDB(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not available, using in-memory cache only');
      this.useIndexedDB = false;
      return;
    }

    return new Promise((resolve) => {
      const request = indexedDB.open('DriveNarratorVoiceCache', 1);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        this.useIndexedDB = false;
        resolve();
      };

      request.onsuccess = () => {
        this.indexedDB = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('responses')) {
          const objectStore = db.createObjectStore('responses', { keyPath: 'id' });
          objectStore.createIndex('requestKey', 'requestKey', { unique: false });
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          objectStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  /**
   * Generate cache key from request parameters
   */
  private generateCacheKey(text: string, voiceId: string, personaId?: string): string {
    // Normalize text (lowercase, trim whitespace, remove punctuation)
    const normalized = text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '');

    // Create hash
    const data = `${normalized}|${voiceId}|${personaId || ''}`;
    return this.simpleHash(data);
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get cached response
   */
  async get(text: string, voiceId: string, personaId?: string): Promise<CachedResponse | null> {
    const requestKey = this.generateCacheKey(text, voiceId, personaId);

    // Check memory cache first
    if (this.memoryCache.has(requestKey)) {
      const cached = this.memoryCache.get(requestKey)!;
      cached.accessCount++;
      cached.lastAccessed = Date.now();
      this.hitCount++;
      return cached;
    }

    // Check IndexedDB if available
    if (this.useIndexedDB && this.indexedDB) {
      const cached = await this.getFromIndexedDB(requestKey);
      if (cached) {
        // Update access stats
        cached.accessCount++;
        cached.lastAccessed = Date.now();
        await this.putToIndexedDB(cached);

        // Add to memory cache for faster access
        this.memoryCache.set(requestKey, cached);

        this.hitCount++;
        return cached;
      }
    }

    this.missCount++;
    return null;
  }

  /**
   * Store response in cache
   */
  async put(
    text: string,
    voiceId: string,
    audioData: ArrayBuffer,
    transcript: string,
    personaId?: string,
  ): Promise<void> {
    const requestKey = this.generateCacheKey(text, voiceId, personaId);
    const now = Date.now();

    const cached: CachedResponse = {
      id: `${requestKey}_${now}`,
      requestKey,
      audioData,
      transcript,
      voiceId,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size: audioData.byteLength,
    };

    // Add to memory cache
    this.memoryCache.set(requestKey, cached);

    // Add to IndexedDB if available
    if (this.useIndexedDB && this.indexedDB) {
      await this.putToIndexedDB(cached);
      await this.enforceStorageLimits();
    }
  }

  /**
   * Check if response is cached
   */
  async has(text: string, voiceId: string, personaId?: string): Promise<boolean> {
    const requestKey = this.generateCacheKey(text, voiceId, personaId);

    if (this.memoryCache.has(requestKey)) {
      return true;
    }

    if (this.useIndexedDB && this.indexedDB) {
      const cached = await this.getFromIndexedDB(requestKey);
      return cached !== null;
    }

    return false;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    const entries = await this.getAllEntries();
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map((e) => e.timestamp);

    return {
      totalEntries: entries.length,
      totalSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate:
        this.hitCount + this.missCount > 0 ? this.hitCount / (this.hitCount + this.missCount) : 0,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Clear all cached responses
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.useIndexedDB && this.indexedDB) {
      const transaction = this.indexedDB.transaction(['responses'], 'readwrite');
      const objectStore = transaction.objectStore('responses');
      await this.promisifyRequest(objectStore.clear());
    }

    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Remove old entries based on age
   */
  async clearOld(maxAgeDays: number = MAX_CACHE_AGE_DAYS): Promise<void> {
    const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    const entries = await this.getAllEntries();

    for (const entry of entries) {
      if (entry.timestamp < cutoffTime) {
        await this.delete(entry.requestKey);
      }
    }
  }

  /**
   * Delete specific entry
   */
  async delete(requestKey: string): Promise<void> {
    this.memoryCache.delete(requestKey);

    if (this.useIndexedDB && this.indexedDB) {
      const entries = await this.getAllEntries();
      const entry = entries.find((e) => e.requestKey === requestKey);
      if (entry) {
        const transaction = this.indexedDB.transaction(['responses'], 'readwrite');
        const objectStore = transaction.objectStore('responses');
        await this.promisifyRequest(objectStore.delete(entry.id));
      }
    }
  }

  /**
   * Pre-cache common responses
   */
  async preCacheCommonResponses(
    commonPhrases: Array<{ text: string; voiceId: string; personaId?: string }>,
  ): Promise<void> {
    // This would typically be called with responses from the backend
    // For now, it's a placeholder that can be implemented when we have common phrases identified
    console.log('Pre-caching', commonPhrases.length, 'common responses');
  }

  /**
   * Get all cached entries
   */
  private async getAllEntries(): Promise<CachedResponse[]> {
    if (!this.useIndexedDB || !this.indexedDB) {
      return Array.from(this.memoryCache.values());
    }

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction(['responses'], 'readonly');
      const objectStore = transaction.objectStore('responses');
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result as CachedResponse[]);
      request.onerror = () => {
        console.error('Error getting all entries:', request.error);
        resolve([]);
      };
    });
  }

  /**
   * Enforce storage limits (size and count)
   */
  private async enforceStorageLimits(): Promise<void> {
    const entries = await this.getAllEntries();
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

    // Sort by last accessed (least recently used first)
    entries.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove entries if over limits
    let currentSize = totalSize;
    let currentCount = entries.length;

    for (const entry of entries) {
      if (currentSize <= maxSizeBytes && currentCount <= MAX_ENTRIES) {
        break;
      }

      await this.delete(entry.requestKey);
      currentSize -= entry.size;
      currentCount--;
    }
  }

  /**
   * Get from IndexedDB
   */
  private async getFromIndexedDB(requestKey: string): Promise<CachedResponse | null> {
    if (!this.indexedDB) return null;

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction(['responses'], 'readonly');
      const objectStore = transaction.objectStore('responses');
      const index = objectStore.index('requestKey');
      const request = index.get(requestKey);

      request.onsuccess = () => {
        const result = request.result as CachedResponse | undefined;
        resolve(result || null);
      };
      request.onerror = () => {
        console.error('Error reading from IndexedDB:', request.error);
        resolve(null);
      };
    });
  }

  /**
   * Put to IndexedDB
   */
  private async putToIndexedDB(cached: CachedResponse): Promise<void> {
    if (!this.indexedDB) return;

    return new Promise((resolve) => {
      const transaction = this.indexedDB!.transaction(['responses'], 'readwrite');
      const objectStore = transaction.objectStore('responses');
      const request = objectStore.put(cached);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error writing to IndexedDB:', request.error);
        resolve(); // Don't reject, just log
      };
    });
  }

  /**
   * Helper to promisify IDB request
   */
  private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const voiceResponseCache = new VoiceResponseCacheService();
