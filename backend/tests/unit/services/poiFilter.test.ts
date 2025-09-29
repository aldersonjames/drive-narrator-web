import { describe, expect, it } from '@jest/globals';

// Placeholder import
import { filterPois } from '../../../src/services/poi/poiFilteringService';

describe('poiFilteringService', () => {
  it('filters POIs to match traveler taxonomy and annotates attribution', () => {
    const pois = [
      {
        poiId: '1',
        categories: ['historical'],
        attribution: { provider: 'ops' },
      },
      {
        poiId: '2',
        categories: ['entertainment'],
        attribution: { provider: 'ops' },
      },
    ];

    expect(() => filterPois(pois, ['historical'])).toThrow();
    // TODO: replace with concrete expectations once implementation exists
  });
});
