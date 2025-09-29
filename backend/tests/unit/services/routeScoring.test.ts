import { describe, expect, it } from '@jest/globals';

// Placeholder import - replace with actual service once implemented
import { scoreRoutes } from '../../../src/services/scoring/routeScoringService';

describe('routeScoringService', () => {
  it('weights POI count and interest alignment', () => {
    const routes = [
      {
        routeId: 'route-a',
        pois: [{ categories: ['historical'] }, { categories: ['historical'] }],
        interestAlignment: 0.9,
        durationMinutes: 180,
      },
      {
        routeId: 'route-b',
        pois: [{ categories: ['scenic'] }],
        interestAlignment: 0.6,
        durationMinutes: 170,
      },
    ];

    expect(() => scoreRoutes(routes, ['historical'])).toThrow();
    // TODO: replace with concrete assertions once service is implemented
  });
});
