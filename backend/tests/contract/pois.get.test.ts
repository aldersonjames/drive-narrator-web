import request from 'supertest';

import app from '../../src/api/app';

type PoiResponse = {
  poiId: string;
  name: string;
  category: string;
  relevance: number;
  coordinates: { lat: number; lng: number };
  geometry: { type: string; coordinates: [number, number] };
  summary: string;
  narrationPreview: string;
  attribution: { provider: string };
  images: Array<{ url: string }>;
};

type Notice = { code: string; message: string };

describe('GET /api/pois contract', () => {
  it('returns filtered POIs with attribution and no-match notice when empty', async () => {
    const response = await request(app)
      .get('/api/pois')
      .query({ routeId: 'route-123', interests: 'historical,scenic' });

    expect(response.status).toBe(200);

    const { pois, notices } = response.body as {
      routeId: string;
      pois: PoiResponse[];
      notices: Notice[];
    };

    pois.forEach((poi) => {
      expect(poi).toMatchObject({
        poiId: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
        coordinates: { lat: expect.any(Number), lng: expect.any(Number) },
        geometry: expect.objectContaining({
          type: expect.any(String),
          coordinates: expect.any(Array),
        }),
        summary: expect.any(String),
        narrationPreview: expect.any(String),
        attribution: expect.objectContaining({ provider: expect.any(String) }),
        images: expect.any(Array),
      });
      expect(poi.category.toLowerCase()).toMatch(/historical|scenic/);
    });

    if (pois.length === 0) {
      expect(notices).toContainEqual(
        expect.objectContaining({
          code: 'NO_MATCHING_POIS',
          message: expect.stringContaining('No POIs matched the selected interests'),
        }),
      );
    }
  });
});
