import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { createCategoriesController } from '../../../src/api/routes/categoriesController';
import type {
  PoiCategoryGroup,
  CategoryCatalogService,
} from '../../../src/services/poi/categoryCatalogService';
import type { PoiProviderClient } from '../../../src/services/poi/poiProviderClient';

describe('createCategoriesController', () => {
  it('returns catalog with provider metadata', async () => {
    const groups: PoiCategoryGroup[] = [
      {
        groupId: 220,
        groupName: 'historic',
        categories: [
          {
            categoryId: 228,
            osmKey: 'historic',
            osmValue: 'battlefield',
            label: 'historic.battlefield',
          },
        ],
      },
    ];

    const catalogServiceMock = {
      getCatalog: jest.fn().mockResolvedValue(groups),
    };

    const poiProviderMock = {
      isFoursquareEnabled: jest.fn().mockReturnValue(false),
    };

    const controller = createCategoriesController({
      catalogService: catalogServiceMock as unknown as Pick<CategoryCatalogService, 'getCatalog'>,
      poiProvider: poiProviderMock as unknown as Pick<PoiProviderClient, 'isFoursquareEnabled'>,
    });

    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { status, json };

    await controller({} as unknown as Request, res as unknown as Response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        groups,
        metadata: expect.objectContaining({ providers: { ops: true, foursquare: false } }),
      }),
    );
  });
});
