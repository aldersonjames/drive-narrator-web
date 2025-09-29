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
});
