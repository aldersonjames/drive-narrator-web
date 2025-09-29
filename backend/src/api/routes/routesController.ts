import type { Request, Response } from 'express';

import type {
  OpenRouteServiceClient,
  RouteResponse,
  RouteFeature,
} from '../../services/routing/openRouteServiceClient';
import type { PoiProviderClient, PoiResult } from '../../services/poi/poiProviderClient';
import type { PoiFilteringService } from '../../services/poi/poiFilteringService';
import type { RouteScoringService, RouteScore } from '../../services/scoring/routeScoringService';

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

  return scores.map((scoreEntry, index) => {
    const feature =
      featureMap.get(scoreEntry.routeId) ??
      routeResponse.features[index] ??
      routeResponse.features[0];
    const poisForRoute = pois.map((poi) => ({
      poiId: poi.poiId,
      name: poi.name,
      category: poi.category,
      relevance: poi.relevance,
      coordinates: poi.coordinates,
      summary: poi.summary,
      narrationPreview: poi.summary.slice(0, 120),
      attribution: poi.attribution,
    }));

    return {
      routeId: scoreEntry?.routeId ?? `route-${index}`,
      polyline: feature ? JSON.stringify(feature.geometry.coordinates) : '[]',
      durationMinutes: feature ? feature.properties.summary.duration / 60 : 0,
      distanceKm: feature ? feature.properties.summary.distance / 1000 : 0,
      score: scoreEntry?.score ?? 0,
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
};

export const createRoutesController = (deps: Dependencies) => {
  return async function routesController(req: Request, res: Response): Promise<Response> {
    const { origin, destination, interests } = req.body ?? {};

    if (!origin || !destination || !Array.isArray(interests)) {
      return res
        .status(400)
        .json({ code: 'INVALID_REQUEST', message: 'origin, destination, interests required' });
    }

    try {
      const [routes, pois] = await Promise.all([
        deps.orsClient.getRoutes({
          origin,
          destination,
          alternatives: 3,
        }),
        deps.poiClient.fetchPois({
          routeId: 'temp',
          interestTags: interests,
          limit: 100,
        }),
      ]);

      const filtered = deps.poiFilter.filterByInterests(pois, interests);

      const candidates = routes.features.map((feature, index) => ({
        routeId: `route-${index}`,
        pois: filtered.pois.map((poi) => ({
          poiId: poi.poiId,
          categories: [poi.category],
          relevance: poi.relevance,
        })),
        durationMinutes: feature.properties.summary.duration / 60,
        distanceKm: feature.properties.summary.distance / 1000,
      }));

      const scored = deps.scoring.scoreRoutes(candidates, interests);
      const formatted = formatRoutes(routes, scored, filtered.pois);

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
