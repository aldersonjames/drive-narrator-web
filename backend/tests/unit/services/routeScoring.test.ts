import { describe, expect, it } from '@jest/globals';

import { RouteScoringService } from '../../../src/services/scoring/routeScoringService';

describe('routeScoringService', () => {
  it('weights POI count and interest alignment', () => {
    const service = new RouteScoringService();
    const routes = [
      {
        routeId: 'route-a',
        pois: [
          { poiId: 'poi-1', categories: ['historical'], relevance: 0.9 },
          { poiId: 'poi-2', categories: ['historical'], relevance: 0.8 },
        ],
        durationMinutes: 180,
        distanceKm: 320,
      },
      {
        routeId: 'route-b',
        pois: [{ poiId: 'poi-3', categories: ['scenic'], relevance: 0.6 }],
        durationMinutes: 170,
        distanceKm: 310,
      },
    ];

    const scored = service.scoreRoutes(routes, ['historical']);

    expect(scored).toHaveLength(2);
    expect(scored[0].routeId).toBe('route-a');
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
    expect(scored[0].scoreBreakdown.poiCount).toBeGreaterThan(scored[1].scoreBreakdown.poiCount);
  });
});
