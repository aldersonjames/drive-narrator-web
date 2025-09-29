import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { createCategoriesController } from '../../../src/api/routes/categoriesController';
import type { PoiCategoryGroup } from '../../../src/services/poi/categoryCatalogService';

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

    const catalogService = {
      getCatalog: jest.fn().mockResolvedValue(groups),
    };

    const poiProvider = {
      isFoursquareEnabled: jest.fn().mockReturnValue(false),
    };

    const controller = createCategoriesController({
      catalogService: catalogService as unknown as typeof catalogService,
      poiProvider: poiProvider as unknown as typeof poiProvider,
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
