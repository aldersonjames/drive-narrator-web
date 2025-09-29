export interface RoutePoi {
  poiId: string;
  categories: string[];
  relevance?: number;
}

export interface RouteCandidate {
  routeId: string;
  pois: RoutePoi[];
  durationMinutes: number;
  distanceKm: number;
}

export interface RouteScore {
  routeId: string;
  score: number;
  scoreBreakdown: {
    poiCount: number;
    interestAlignment: number;
    diversity: number;
    durationPenalty: number;
  };
}

const MAX_DURATION = 600; // 10 hours sanity cap

export class RouteScoringService {
  scoreRoutes(routes: RouteCandidate[], interestTags: string[]): RouteScore[] {
    if (!routes.length) {
      return [];
    }

    const normalizedInterest = interestTags.map((tag) => tag.toLowerCase());
    const maxPoiCount = Math.max(...routes.map((route) => route.pois.length), 1);

    return routes
      .map((route) => {
        const poiCountScore = route.pois.length / maxPoiCount;
        const interestAlignmentScore = this.computeInterestAlignment(
          route.pois,
          normalizedInterest,
        );
        const diversityScore = this.computeDiversity(route.pois);
        const durationPenalty = this.computeDurationPenalty(route.durationMinutes);

        const score =
          poiCountScore * 0.4 +
          interestAlignmentScore * 0.4 +
          diversityScore * 0.2 -
          durationPenalty;

        return {
          routeId: route.routeId,
          score: Number(score.toFixed(3)),
          scoreBreakdown: {
            poiCount: Number(poiCountScore.toFixed(3)),
            interestAlignment: Number(interestAlignmentScore.toFixed(3)),
            diversity: Number(diversityScore.toFixed(3)),
            durationPenalty: Number(durationPenalty.toFixed(3)),
          },
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  private computeInterestAlignment(pois: RoutePoi[], interests: string[]): number {
    if (!interests.length) {
      return 0.5;
    }

    if (!pois.length) {
      return 0;
    }

    let matches = 0;
    pois.forEach((poi) => {
      const categoryMatches = poi.categories.some((category) => {
        const lower = category.toLowerCase();
        return interests.some((interest) => lower.includes(interest));
      });
      if (categoryMatches) {
        matches += poi.relevance ?? 1;
      }
    });

    return Math.min(matches / pois.length, 1);
  }

  private computeDiversity(pois: RoutePoi[]): number {
    if (!pois.length) {
      return 0;
    }

    const categories = new Set<string>();
    pois.forEach((poi) =>
      poi.categories.forEach((category) => categories.add(category.toLowerCase())),
    );
    return Math.min(categories.size / 10, 1);
  }

  private computeDurationPenalty(durationMinutes: number): number {
    const capped = Math.min(durationMinutes, MAX_DURATION);
    const penalty = capped / MAX_DURATION;
    return penalty * 0.1; // weigh less heavily than other factors
  }
}
