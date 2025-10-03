import type { Request, Response } from 'express';
import { z } from 'zod';

import type {
  OpenRouteServiceClient,
  RouteResponse,
  RouteFeature,
} from '../../services/routing/openRouteServiceClient';
import type { LineString } from 'geojson';
import type { PoiProviderClient, PoiResult } from '../../services/poi/poiProviderClient';
import type { PoiFilteringService } from '../../services/poi/poiFilteringService';
import type { RouteScoringService, RouteScore } from '../../services/scoring/routeScoringService';
import { validate } from '../../utils/validation';
import { logger } from '../../utils/logger';

interface Dependencies {
  orsClient: OpenRouteServiceClient;
  poiClient: PoiProviderClient;
  poiFilter: PoiFilteringService;
  scoring: RouteScoringService;
}

const formatRoutes = (routeResponse: RouteResponse, scores: RouteScore[], pois: PoiResult[]) => {
  const featureMap = new Map<string, RouteFeature>();
  routeResponse.features.forEach((feature, index) => {
    featureMap.set(`route-${index}`, feature);
  });

  const maxScore = scores.length ? Math.max(...scores.map((entry) => entry.score)) : 1;
  const minScore = scores.length ? Math.min(...scores.map((entry) => entry.score)) : 0;
  const denominator = maxScore - minScore;

  const formatted = scores.map((scoreEntry, index) => {
    const feature =
      featureMap.get(scoreEntry.routeId) ??
      routeResponse.features[index] ??
      routeResponse.features[0];
    const geometry: LineString = {
      type: 'LineString',
      coordinates: feature?.geometry.coordinates ?? [],
    };
    const normalized = denominator === 0 ? 1 : (scoreEntry.score - minScore) / denominator;
    const poisForRoute = pois.map((poi) => ({
      id: poi.poiId,
      poiId: poi.poiId,
      name: poi.name,
      category: poi.category,
      categories: poi.categories,
      relevance: poi.relevance,
      coordinates: poi.coordinates,
      geometry: poi.geometry,
      summary: poi.summary,
      narrationPreview: poi.narrationPreview ?? poi.summary.slice(0, 160),
      attribution: poi.attribution,
      images: poi.images ?? [],
    }));

    return {
      routeId: scoreEntry?.routeId ?? `route-${index}`,
      polyline: feature ? JSON.stringify(feature.geometry.coordinates) : '[]',
      geometry,
      durationMinutes: feature ? feature.properties.summary.duration / 60 : 0,
      distanceKm: feature ? feature.properties.summary.distance / 1000 : 0,
      score: scoreEntry?.score ?? 0,
      scoreNormalized: Number(normalized.toFixed(3)),
      scoreRank: index + 1,
      scoreBreakdown: scoreEntry?.scoreBreakdown ?? {
        poiCount: 0,
        interestAlignment: 0,
        diversity: 0,
        durationPenalty: 0,
      },
      pois: poisForRoute,
      attribution: { source: 'openrouteservice' },
    };
  });

  const seen = new Set<string>();
  const unique: typeof formatted = [];
  formatted.forEach((route) => {
    const key = JSON.stringify(route.geometry.coordinates);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(route);
    }
  });

  return unique;
};

const interestListSchema = z.array(z.string().min(1)).min(1);

const routesRequestSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureTime: z.string().optional(),
  interests: interestListSchema,
});

const parseInterestTags = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
      .map((entry) => entry.trim())
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

export const createRoutesController = (deps: Dependencies) => {
  return async function routesController(req: Request, res: Response): Promise<Response> {
    const payload = validate(routesRequestSchema, {
      origin: req.body?.origin,
      destination: req.body?.destination,
      departureTime: req.body?.departureTime,
      interests: parseInterestTags(req.body?.interests ?? req.body?.interestTags),
    });

    try {
      const [routes, pois] = await Promise.all([
        deps.orsClient.getRoutes({
          origin: payload.origin,
          destination: payload.destination,
          alternatives: 3,
        }),
        deps.poiClient.fetchPois({
          routeId: 'temp',
          interestTags: payload.interests,
          limit: 100,
        }),
      ]);

      const filtered = deps.poiFilter.filterByInterests(pois, payload.interests);

      const candidates = routes.features.map((feature, index) => ({
        routeId: `route-${index}`,
        pois: filtered.pois.map((poi) => ({
          poiId: poi.poiId,
          categories: poi.categories,
          relevance: poi.relevance,
        })),
        durationMinutes: feature.properties.summary.duration / 60,
        distanceKm: feature.properties.summary.distance / 1000,
      }));

      const scored = deps.scoring.scoreRoutes(candidates, payload.interests);
      let formatted = formatRoutes(routes, scored, filtered.pois);

      const dedupe = (items: ReturnType<typeof formatRoutes>) => {
        const seen = new Set<string>();
        return items.filter((item) => {
          const key = JSON.stringify(item.geometry.coordinates);
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      };

      formatted = dedupe(formatted);

      const desiredRoutes = 3;

      if (formatted.length < desiredRoutes) {
        const additionalPrefs: Array<'fastest' | 'shortest' | 'green' | 'recommended'> = [
          'fastest',
          'shortest',
          'green',
          'recommended',
        ];

        for (const preference of additionalPrefs) {
          if (formatted.length >= desiredRoutes) break;
          try {
            const prefResponse = await deps.orsClient.getRoutes({
              origin: payload.origin,
              destination: payload.destination,
              departureTime: payload.departureTime,
              alternatives: 1,
              preference,
            });

            const prefCandidates = prefResponse.features.map((feature, index) => ({
              routeId: `pref-${preference}-${index}`,
              pois: filtered.pois.map((poi) => ({
                poiId: poi.poiId,
                categories: poi.categories,
                relevance: poi.relevance,
              })),
              durationMinutes: feature.properties.summary.duration / 60,
              distanceKm: feature.properties.summary.distance / 1000,
            }));

            const prefScores = deps.scoring.scoreRoutes(prefCandidates, payload.interests);
            const prefFormatted = formatRoutes(prefResponse, prefScores, filtered.pois);
            formatted = dedupe([...formatted, ...prefFormatted]);
          } catch (prefError) {
            logger.warn('route-preference-failed', {
              preference,
              message: (prefError as Error).message,
            });
          }
        }
      }

      const notices = [...filtered.notices];
      if (formatted.length < 2) {
        notices.push({
          code: 'LIMITED_OPTIONS',
          message: 'Only one route available at this time.',
        });
      }

      return res.status(201).json({
        requestId: `req-${Date.now()}`,
        routes: formatted,
        notices,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ code: 'ROUTE_GENERATION_FAILED', message: (error as Error).message });
    }
  };
};
