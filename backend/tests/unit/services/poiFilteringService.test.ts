import { describe, expect, it } from '@jest/globals';
import { PoiFilteringService } from '../../../src/services/poi/poiFilteringService';
import type { PoiResult } from '../../../src/services/poi/poiProviderClient';

describe('PoiFilteringService', () => {
  const service = new PoiFilteringService();

  const makePoi = (overrides: Partial<PoiResult>): PoiResult => {
    const coordinates = overrides.coordinates ?? { lat: 0, lng: 0 };
    const summary = overrides.summary ?? 'summary';
    return {
      poiId: overrides.poiId ?? 'poi-id',
      name: overrides.name ?? 'Sample POI',
      category: overrides.category ?? 'unknown',
      categories: overrides.categories ?? [overrides.category ?? 'unknown'],
      relevance: overrides.relevance ?? 0.5,
      coordinates,
      geometry: overrides.geometry ?? {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat],
      },
      summary,
      narrationPreview: overrides.narrationPreview ?? summary.slice(0, 160),
      attribution: overrides.attribution ?? { provider: 'test' },
      images: overrides.images ?? [],
      raw: overrides.raw ?? {},
    };
  };

  it('prioritises Civil War history POIs when interest is civil_war_history', () => {
    const pois: PoiResult[] = [
      makePoi({
        poiId: 'battlefield',
        name: "Battle of Ramsour's Mill",
        category: 'historic.battlefield',
        categories: ['historic.battlefield', 'historic', 'battlefield'],
        relevance: 0.9,
      }),
      makePoi({
        poiId: 'museum',
        name: 'Science Discovery Center',
        category: 'tourism.museum',
        categories: ['tourism.museum', 'museum'],
        relevance: 0.6,
      }),
      makePoi({
        poiId: 'aquarium',
        name: 'Aquarium',
        category: 'amenity.aquarium',
        categories: ['amenity.aquarium', 'aquarium'],
        relevance: 0.95,
      }),
    ];

    const { pois: filtered, notices } = service.filterByInterests(pois, ['civil_war_history']);

    expect(notices).toHaveLength(0);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].poiId).toBe('battlefield');
    expect(filtered.map((poi) => poi.poiId)).toEqual(['battlefield', 'museum']);
  });

  it('falls back to distillery-adjacent venues when craft.distillery tags are absent', () => {
    const pois: PoiResult[] = [
      makePoi({
        poiId: 'pub',
        name: 'Old Town Pub',
        category: 'amenity.pub',
        categories: ['amenity.pub', 'pub', 'amenity'],
        relevance: 0.8,
      }),
      makePoi({
        poiId: 'art-gallery',
        name: 'Art Gallery',
        category: 'tourism.gallery',
        categories: ['tourism.gallery', 'gallery'],
        relevance: 0.7,
      }),
    ];

    const { pois: filtered, notices } = service.filterByInterests(pois, ['distilleries']);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].poiId).toBe('pub');
    expect(notices).toHaveLength(0);
  });

  it('returns a notice when no POIs match the traveler interests', () => {
    const scenicPoi = makePoi({
      poiId: 'scenic-overlook',
      name: 'Blue Ridge Overlook',
      category: 'tourism.viewpoint',
      categories: ['tourism.viewpoint', 'viewpoint'],
      relevance: 0.9,
    });

    const { pois: filtered, notices } = service.filterByInterests([scenicPoi], ['entertainment']);

    expect(filtered).toHaveLength(0);
    expect(notices).toEqual([
      {
        code: 'NO_MATCHING_POIS',
        message:
          'No points of interest matched the selected interests. Try broadening categories for more results.',
      },
    ]);
  });
});
