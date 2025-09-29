import type { PoiResult } from './poiProviderClient';

export interface FilterResult {
  pois: PoiResult[];
  notices: Array<{ code: string; message: string }>;
}

const INTEREST_TAXONOMY: Record<string, string[]> = {
  historical: ['historic', 'history', 'monument', 'archaeology'],
  scenic: ['viewpoint', 'nature', 'landscape', 'park', 'panorama'],
  entertainment: ['music', 'concert', 'entertainment', 'nightlife'],
  cultural: ['museum', 'gallery', 'culture', 'heritage'],
  family: ['zoo', 'aquarium', 'family', 'amusement'],
};

export class PoiFilteringService {
  filterByInterests(pois: PoiResult[], interestTags: string[]): FilterResult {
    if (!interestTags.length) {
      return { pois: this.sortByRelevance(pois), notices: [] };
    }

    const normalizedTags = interestTags.map((tag) => tag.toLowerCase());

    const allowedCategories = new Set<string>();
    normalizedTags.forEach((tag) => {
      const mapped = INTEREST_TAXONOMY[tag] ?? [tag];
      mapped.forEach((category) => allowedCategories.add(category.toLowerCase()));
    });

    const filtered = pois.filter((poi) => this.matchesInterest(poi.category, allowedCategories));

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

  private matchesInterest(category: string, allowed: Set<string>): boolean {
    const lower = category.toLowerCase();
    if (allowed.has(lower)) {
      return true;
    }

    for (const entry of allowed) {
      if (lower.includes(entry)) {
        return true;
      }
    }

    return false;
  }

  private sortByRelevance(pois: PoiResult[]): PoiResult[] {
    return [...pois].sort((a, b) => b.relevance - a.relevance);
  }
}
