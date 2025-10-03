import { buildStoryTimeline } from '../../../src/pages/launchTimelineUtils';
import { narrationTimeline as fallbackTimeline } from '../../../src/mock/demoData';
import type { RouteSummary } from '../../../../shared/types/tripNarrator';

const makePoi = (overrides: Partial<RouteSummary['pois'][number]>) => ({
  id: overrides.id ?? 'poi-1',
  poiId: overrides.poiId ?? overrides.id ?? 'poi-1',
  name: overrides.name ?? 'Blue Ridge Overlook',
  category: overrides.category ?? 'scenic.viewpoint',
  categories: overrides.categories ?? ['scenic.viewpoint', 'nature.mountain'],
  relevance: overrides.relevance ?? 0.92,
  coordinates: overrides.coordinates ?? { lat: 35.5, lng: -82.3 },
  geometry: overrides.geometry ?? { type: 'Point', coordinates: [-82.3, 35.5] },
  summary: overrides.summary ?? 'Sunrise paints the ridge in coral light.',
  narrationPreview: overrides.narrationPreview ?? 'Sunrise paints the ridge in coral light.',
  attribution: overrides.attribution ?? { provider: 'trip-narrator' },
  images: overrides.images ?? [],
});

const sampleRoute: RouteSummary = {
  routeId: 'story-route',
  polyline: '[]',
  geometry: { type: 'LineString', coordinates: [] },
  durationMinutes: 150,
  distanceKm: 210,
  score: 0.84,
  scoreNormalized: 0.91,
  scoreRank: 1,
  scoreBreakdown: {
    poiCount: 0.9,
    interestAlignment: 0.88,
    diversity: 0.72,
    durationPenalty: 0.1,
  },
  pois: [
    makePoi({ id: 'poi-1' }),
    makePoi({
      id: 'poi-2',
      name: 'Valley Echo Trail',
      narrationPreview: 'Ferns frame a whispering creek along the valley.',
    }),
    makePoi({
      id: 'poi-3',
      name: 'Hidden Orchard',
      narrationPreview: 'Local storytellers pour heirloom cider beside the grove.',
    }),
  ],
  attribution: { source: 'Trip Narrator' },
};

describe('buildStoryTimeline', () => {
  it('creates story beats using narration previews and formatted categories', () => {
    const timeline = buildStoryTimeline(sampleRoute, []);

    expect(timeline).toHaveLength(3);
    expect(timeline[0].title).toBe('Blue Ridge Overlook');
    expect(timeline[0].eta).toMatch(/^In \d+/);
    expect(timeline[0].distance).toContain('Sunrise paints');
    expect(timeline[0].categories).toContain('Scenic Viewpoint');
  });

  it('falls back to default narration timeline when no POIs exist', () => {
    expect(buildStoryTimeline(undefined)).toEqual(fallbackTimeline);
  });
});
