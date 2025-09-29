import { describe, expect, it, jest } from '@jest/globals';

import { CategoryCatalogService } from '../../../src/services/poi/categoryCatalogService';
import type { PoiProviderClient } from '../../../src/services/poi/poiProviderClient';

describe('CategoryCatalogService', () => {
  it('transforms OPS catalog into normalized groups', async () => {
    const rawCatalog = {
      historic: {
        id: 220,
        children: {
          historic: {
            battlefield: 228,
            memorial: 237,
          },
        },
      },
    };

    const poiClient = {
      fetchOpsCategoryCatalog: jest.fn().mockResolvedValue(rawCatalog),
    } as unknown as PoiProviderClient;

    const service = new CategoryCatalogService(poiClient, 1_000);
    const catalog = await service.getCatalog();

    expect(catalog).toHaveLength(1);
    expect(catalog[0]).toEqual({
      groupId: 220,
      groupName: 'historic',
      categories: [
        {
          categoryId: 228,
          osmKey: 'historic',
          osmValue: 'battlefield',
          label: 'historic.battlefield',
        },
        {
          categoryId: 237,
          osmKey: 'historic',
          osmValue: 'memorial',
          label: 'historic.memorial',
        },
      ],
    });
  });

  it('returns cached value when available', async () => {
    const poiClient = {
      fetchOpsCategoryCatalog: jest
        .fn()
        .mockResolvedValue({ historic: { id: 220, children: { historic: { battlefield: 228 } } } }),
    } as unknown as PoiProviderClient;

    const service = new CategoryCatalogService(poiClient, 10_000);
    const first = await service.getCatalog();
    const second = await service.getCatalog();

    expect(first).toBe(second);
    expect(poiClient.fetchOpsCategoryCatalog).toHaveBeenCalledTimes(1);
  });
});
