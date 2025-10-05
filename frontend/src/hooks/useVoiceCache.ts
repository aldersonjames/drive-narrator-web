/**
 * Hook for voice response caching
 * Provides easy access to cached voice responses
 */

import { useState, useCallback, useEffect } from 'react';
import { voiceResponseCache, CacheStats } from '../services/voice/voiceResponseCache';

export function useVoiceCache() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load stats on mount
  useEffect(() => {
    voiceResponseCache.getStats().then(setStats);
  }, []);

  const getCachedResponse = useCallback(
    async (text: string, voiceId: string, personaId?: string) => {
      setIsLoading(true);
      try {
        const cached = await voiceResponseCache.get(text, voiceId, personaId);
        const newStats = await voiceResponseCache.getStats();
        setStats(newStats);
        return cached;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const cacheResponse = useCallback(
    async (
      text: string,
      voiceId: string,
      audioData: ArrayBuffer,
      transcript: string,
      personaId?: string,
    ) => {
      setIsLoading(true);
      try {
        await voiceResponseCache.put(text, voiceId, audioData, transcript, personaId);
        const newStats = await voiceResponseCache.getStats();
        setStats(newStats);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const isCached = useCallback(async (text: string, voiceId: string, personaId?: string) => {
    return voiceResponseCache.has(text, voiceId, personaId);
  }, []);

  const clearCache = useCallback(async () => {
    setIsLoading(true);
    try {
      await voiceResponseCache.clear();
      const newStats = await voiceResponseCache.getStats();
      setStats(newStats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearOldEntries = useCallback(async (maxAgeDays: number = 7) => {
    setIsLoading(true);
    try {
      await voiceResponseCache.clearOld(maxAgeDays);
      const newStats = await voiceResponseCache.getStats();
      setStats(newStats);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    const newStats = await voiceResponseCache.getStats();
    setStats(newStats);
  }, []);

  return {
    stats,
    isLoading,
    getCachedResponse,
    cacheResponse,
    isCached,
    clearCache,
    clearOldEntries,
    refreshStats,
  };
}
