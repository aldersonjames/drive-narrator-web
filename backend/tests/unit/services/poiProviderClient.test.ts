import { describe, expect, it, jest } from '@jest/globals';

import { PoiProviderClient } from '../../../src/services/poi/poiProviderClient';

describe('PoiProviderClient', () => {
  it('falls back to OPS when Foursquare requested without API key', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ historic: { id: 220, children: {} } }),
    });

    const client = new PoiProviderClient({
      provider: 'foursquare',
      opsApiKey: 'ops-key',
      fetchImpl,
    });

    expect(client.isFoursquareEnabled()).toBe(false);

    await client.fetchOpsCategoryCatalog();
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.openpoiservice.org/v1/pois',
      expect.any(Object),
    );
    const options = fetchImpl.mock.calls[0][1];
    expect(options?.body).toContain('"list"');
  });

  it('reports Foursquare availability when API key provided', () => {
    const client = new PoiProviderClient({
      provider: 'foursquare',
      opsApiKey: 'ops-key',
      foursquareApiKey: 'fsq-key',
    });

    expect(client.isFoursquareEnabled()).toBe(true);
  });

  it('fetches POIs from Foursquare when enabled', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            fsq_id: 'poi-123',
            name: 'Sample Spot',
            categories: [{ name: 'Historic Site' }],
            geocodes: { main: { latitude: 10, longitude: 20 } },
            rating: 8,
          },
        ],
      }),
    });

    const client = new PoiProviderClient({
      provider: 'foursquare',
      opsApiKey: 'ops-key',
      foursquareApiKey: 'fsq-key',
      fetchImpl,
    });

    const result = await client.fetchPois({
      routeId: 'route-123',
      interestTags: ['historic'],
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      expect.stringContaining('https://api.foursquare.com/v3/places/search'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'fsq-key' }) }),
    );
    expect(result[0]?.attribution.provider).toBe('foursquare');
  });

  it('fetches POIs from openpoiservice without API key when allowed', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              id: 123,
              name: 'Local Park',
              category: 'leisure.park',
              relevance: 0.9,
            },
            geometry: {
              coordinates: [-84.39, 33.75],
            },
          },
        ],
      }),
    });

    const client = new PoiProviderClient({
      opsBaseUrl: 'http://localhost:5500',
      opsPoisPath: 'pois',
      allowUnauthenticatedOps: true,
      fetchImpl,
    });

    const pois = await client.fetchPois({
      routeId: 'route-xyz',
      interestTags: ['leisure'],
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:5500/pois',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      }),
    );
    expect(pois[0]?.name).toBe('Local Park');
    expect(pois[0]?.attribution.provider).toBe('openpoiservice');
  });
});
