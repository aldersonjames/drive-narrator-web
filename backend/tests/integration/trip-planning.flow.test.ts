import request from 'supertest';

import app from '../../src/api/app';

type RankedRoute = { routeId: string; score: number };
type Notice = { code: string; message: string };

describe('Trip planning flow integration', () => {
  it('coordinates routing + POI aggregation and returns ranked routes with notices', async () => {
    const response = await request(app)
      .post('/api/routes')
      .send({
        origin: 'Austin, TX',
        destination: 'Santa Fe, NM',
        departureTime: '2025-10-03T15:00:00Z',
        interests: ['scenic', 'cultural'],
      });

    expect(response.status).toBe(201);

    const { routes, notices } = response.body as {
      routes: RankedRoute[];
      notices: Notice[];
    };

    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBeGreaterThanOrEqual(1);

    const sorted = [...routes].sort((a, b) => b.score - a.score);
    expect(routes.map((r) => r.routeId)).toEqual(sorted.map((r) => r.routeId));

    if (routes.length < 2) {
      expect(notices).toContainEqual(expect.objectContaining({ code: 'LIMITED_OPTIONS' }));
    }
  });
});
