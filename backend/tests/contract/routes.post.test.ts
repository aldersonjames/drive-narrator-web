import request from 'supertest';

import app from '../../src/api/app';

type PoiResponse = {
  poiId: string;
  name: string;
  category: string;
  coordinates: { lat: number; lng: number };
  summary: string;
  narrationPreview: string;
  attribution: { provider: string };
};

type RouteResponse = {
  routeId: string;
  polyline: string;
  durationMinutes: number;
  distanceKm: number;
  score: number;
  scoreBreakdown: { poiCount: number; interestAlignment: number };
  pois: PoiResponse[];
  attribution: { source: string };
};

type Notice = { code: string; message: string };

describe('POST /api/routes contract', () => {
  it('returns ranked routes with limited-options notice when fewer than two routes are available', async () => {
    const response = await request(app)
      .post('/api/routes')
      .send({
        origin: 'Cleveland, OH',
        destination: 'Boston, MA',
        departureTime: '2025-10-01T09:00:00Z',
        interests: ['historical'],
      });

    expect(response.status).toBe(201);

    const { routes, notices } = response.body as {
      requestId: string;
      routes: RouteResponse[];
      notices: Notice[];
    };

    expect(routes.length).toBeGreaterThanOrEqual(1);
    expect(routes.length).toBeLessThanOrEqual(3);

    routes.forEach((route) => {
      expect(route).toMatchObject({
        routeId: expect.any(String),
        polyline: expect.any(String),
        durationMinutes: expect.any(Number),
        distanceKm: expect.any(Number),
        score: expect.any(Number),
        scoreBreakdown: expect.objectContaining({
          poiCount: expect.any(Number),
          interestAlignment: expect.any(Number),
        }),
        attribution: expect.objectContaining({ source: expect.any(String) }),
      });

      route.pois.forEach((poi) => {
        expect(poi).toMatchObject({
          poiId: expect.any(String),
          name: expect.any(String),
          category: expect.any(String),
          coordinates: { lat: expect.any(Number), lng: expect.any(Number) },
          summary: expect.any(String),
          narrationPreview: expect.any(String),
          attribution: expect.objectContaining({ provider: expect.any(String) }),
        });
      });
    });

    if (routes.length < 2) {
      expect(notices).toContainEqual(
        expect.objectContaining({
          code: 'LIMITED_OPTIONS',
          message: expect.stringContaining('Only one route'),
        }),
      );
    }
  });
});
