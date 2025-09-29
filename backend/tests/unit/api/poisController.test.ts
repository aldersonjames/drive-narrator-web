import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { createPoisController } from '../../../src/api/routes/poisController';
import { PoiFilteringService } from '../../../src/services/poi/poiFilteringService';
import type { PoiResult } from '../../../src/services/poi/poiProviderClient';

describe('createPoisController', () => {
  const poiFilter = new PoiFilteringService();

  const makePoi = (overrides: Partial<PoiResult>): PoiResult => {
    const coordinates = overrides.coordinates ?? { lat: 0, lng: 0 };
    const summary = overrides.summary ?? 'Summary';
    return {
      poiId: overrides.poiId ?? 'poi-1',
      name: overrides.name ?? 'Sample POI',
      category: overrides.category ?? 'historic.battlefield',
      categories: overrides.categories ?? ['historic', 'historic.battlefield'],
      relevance: overrides.relevance ?? 0.8,
      coordinates,
      geometry: overrides.geometry ?? {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat],
      },
      summary,
      narrationPreview: overrides.narrationPreview ?? summary.slice(0, 160),
      attribution: overrides.attribution ?? { provider: 'ops' },
      images: overrides.images ?? [],
      raw: overrides.raw ?? {},
    };
  };

  const createMockRes = () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const raw = { status, json };
    return { raw, response: raw as unknown as Response };
  };

  it('filters POIs based on interests and returns provider metadata', async () => {
    const poiClient = {
      fetchPois: jest.fn().mockResolvedValue([
        makePoi({
          poiId: 'battlefield',
          category: 'historic.battlefield',
          categories: ['historic', 'historic.battlefield'],
        }),
        makePoi({
          poiId: 'brewery',
          category: 'amenity.brewery',
          categories: ['amenity', 'amenity.brewery'],
        }),
      ]),
      isFoursquareEnabled: jest.fn().mockReturnValue(false),
    };

    const controller = createPoisController({
      poiClient: poiClient as unknown as typeof poiClient,
      poiFilter,
    });

    const req = {
      query: { routeId: 'route-123', interests: 'historical' },
    } as unknown as Request;
    const { raw, response } = createMockRes();

    await controller(req, response);

    expect(poiClient.fetchPois).toHaveBeenCalledWith({
      routeId: 'route-123',
      interestTags: ['historical'],
      bbox: undefined,
      limit: 50,
    });

    expect(raw.status).toHaveBeenCalledWith(200);
    const payload = raw.json.mock.calls[0][0];
    expect(payload.provider).toEqual({ ops: true, foursquare: false });
    expect(payload.pois).toHaveLength(1);
    expect(payload.pois[0].id).toBe('battlefield');
  });

  it('returns 400 when routeId missing', async () => {
    const poiClient = {
      fetchPois: jest.fn(),
      isFoursquareEnabled: jest.fn().mockReturnValue(false),
    };

    const controller = createPoisController({
      poiClient: poiClient as unknown as typeof poiClient,
      poiFilter,
    });
    const req = { query: {} } as unknown as Request;
    const { raw, response } = createMockRes();

    await controller(req, response);

    expect(raw.status).toHaveBeenCalledWith(400);
    expect(poiClient.fetchPois).not.toHaveBeenCalled();
  });
});
