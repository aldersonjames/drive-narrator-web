import type { PoiResult } from './poiProviderClient';
import { resolveInterestTokens } from './interestTaxonomy';

export interface FilterResult {
  pois: PoiResult[];
  notices: Array<{ code: string; message: string }>;
}

export class PoiFilteringService {
  filterByInterests(pois: PoiResult[], interestTags: string[]): FilterResult {
    if (!interestTags.length) {
      return { pois: this.sortByRelevance(pois), notices: [] };
    }

    const allowedTokens = new Set(resolveInterestTokens(interestTags));

    const filtered = pois.filter((poi) => this.matchesInterest(poi, allowedTokens));

    if (!filtered.length) {
      return {
        pois: [],
        notices: [
          {
            code: 'NO_MATCHING_POIS',
            message:
              'No points of interest matched the selected interests. Try broadening categories for more results.',
          },
        ],
      };
    }

    return { pois: this.sortByRelevance(filtered), notices: [] };
  }

  private matchesInterest(poi: PoiResult, allowed: Set<string>): boolean {
    const categoryTokens = new Set<string>();

    const seedTokens = [poi.category, ...(poi.categories ?? [])];
    seedTokens.forEach((token) => {
      if (!token) {
        return;
      }
      const lower = token.toLowerCase();
      categoryTokens.add(lower);
      lower.split(/[.:/_-]/).forEach((segment) => {
        const trimmed = segment.trim();
        if (trimmed) {
          categoryTokens.add(trimmed);
        }
      });
    });

    for (const token of categoryTokens) {
      if (allowed.has(token)) {
        return true;
      }
    }

    for (const token of categoryTokens) {
      for (const allowedToken of allowed) {
        if (token.includes(allowedToken) || allowedToken.includes(token)) {
          return true;
        }
      }
    }

    return false;
  }

  private sortByRelevance(pois: PoiResult[]): PoiResult[] {
    return [...pois].sort((a, b) => b.relevance - a.relevance);
  }
}
