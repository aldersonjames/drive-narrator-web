import type { Request, Response } from 'express';
import { z } from 'zod';

import type { PoiProviderClient } from '../../services/poi/poiProviderClient';
import type { PoiFilteringService } from '../../services/poi/poiFilteringService';
import { validate } from '../../utils/validation';

interface Dependencies {
  poiClient: PoiProviderClient;
  poiFilter: PoiFilteringService;
}

const parseInterests = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((v) => (typeof v === 'string' ? v.split(',') : []))
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
  }
  return [];
};

const parseBbox = (value: unknown): number[] | undefined => {
  if (!value) return undefined;
  const parts = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : [];
  const numbers = parts.map((part) => Number(part)).filter((num) => !Number.isNaN(num));
  return numbers.length === 4 ? numbers : undefined;
};

const parseLimit = (value: unknown, fallback = 50): number => {
  const next = Number(value);
  if (Number.isFinite(next) && next > 0) {
    return Math.min(next, 100);
  }
  return fallback;
};

const poisQuerySchema = z.object({
  routeId: z.string().min(1),
  interests: z.array(z.string().min(1)).default([]),
  bbox: z.array(z.number()).length(4).optional(),
  limit: z.number().int().positive().max(100).default(50),
});

export const createPoisController = (deps: Dependencies) => {
  return async function poisController(req: Request, res: Response): Promise<Response> {
    const payload = validate(poisQuerySchema, {
      routeId: req.query.routeId,
      interests: parseInterests(req.query.interests),
      bbox: parseBbox(req.query.bbox),
      limit: parseLimit(req.query.limit, 50),
    });

    try {
      const pois = await deps.poiClient.fetchPois({
        routeId: payload.routeId,
        interestTags: payload.interests,
        bbox: payload.bbox,
        limit: payload.limit,
      });

      const filtered = deps.poiFilter.filterByInterests(pois, payload.interests);

      const formatted = filtered.pois.map((poi) => ({
        id: poi.poiId,
        poiId: poi.poiId,
        name: poi.name,
        category: poi.category,
        categories: poi.categories,
        relevance: poi.relevance,
        coordinates: poi.coordinates,
        summary: poi.summary,
        geometry: poi.geometry,
        narrationPreview: poi.narrationPreview ?? poi.summary.slice(0, 160),
        attribution: poi.attribution,
        images: poi.images ?? [],
      }));

      return res.status(200).json({
        pois: formatted,
        notices: filtered.notices,
        provider: {
          ops: true,
          foursquare: deps.poiClient.isFoursquareEnabled(),
        },
      });
    } catch (error) {
      return res.status(502).json({ code: 'POI_LOOKUP_FAILED', message: (error as Error).message });
    }
  };
};
