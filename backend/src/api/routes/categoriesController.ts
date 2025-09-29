import type { Request, Response } from 'express';

import type { CategoryCatalogService } from '../../services/poi/categoryCatalogService';

interface Dependencies {
  catalogService: CategoryCatalogService;
  poiProvider: { isFoursquareEnabled(): boolean };
}

export const createCategoriesController = (deps: Dependencies) => {
  return async function categoriesController(_req: Request, res: Response): Promise<Response> {
    try {
      const catalog = await deps.catalogService.getCatalog();
      return res.status(200).json({
        groups: catalog,
        metadata: {
          providers: {
            ops: true,
            foursquare: deps.poiProvider.isFoursquareEnabled(),
          },
          refreshedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      return res
        .status(502)
        .json({ code: 'CATEGORY_CATALOG_UNAVAILABLE', message: (error as Error).message });
    }
  };
};
