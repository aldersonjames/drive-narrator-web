import { describe, expect, it } from '@jest/globals';

// Placeholder import
import { cacheMatrix } from '../../src/services/offline/offlineCacheMatrix';

describe('service worker caching matrix', () => {
  it('defines caching strategies for routes, POIs, and audio', () => {
    expect(cacheMatrix).toBeDefined();
    // TODO: Replace with concrete assertions once offline module exists
  });
});
