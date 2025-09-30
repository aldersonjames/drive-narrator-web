import type { RouteSummary, PoiSummary } from '../../../shared/types/tripNarrator';

const uid = (() => {
  let i = 0;
  return () => `poi-${++i}`;
})();

const buildPoi = (overrides: Partial<PoiSummary>): PoiSummary => ({
  id: overrides.id ?? uid(),
  name: overrides.name ?? 'Scenic Overlook',
  category: overrides.category ?? 'scenic.viewpoint',
  categories: overrides.categories ?? ['scenic', 'viewpoint'],
  relevance: overrides.relevance ?? 0.75,
  coordinates: overrides.coordinates ?? { lat: 0, lng: 0 },
  geometry: overrides.geometry ?? { type: 'Point', coordinates: [0, 0] },
  summary: overrides.summary ?? 'Panoramic ridge with epic sunrise views.',
  narrationPreview: overrides.narrationPreview ?? 'Legends tell of the valley fog lifting at dawn…',
  attribution: overrides.attribution ?? { provider: 'openpoiservice' },
  images: overrides.images ?? [],
});

export const demoRoutes: RouteSummary[] = [
  {
    routeId: 'route-aurora',
    polyline: '[]',
    geometry: { type: 'LineString', coordinates: [] },
    durationMinutes: 205,
    distanceKm: 341,
    score: 0.86,
    scoreNormalized: 0.92,
    scoreRank: 1,
    scoreBreakdown: {
      poiCount: 0.92,
      interestAlignment: 0.88,
      diversity: 0.77,
      durationPenalty: 0.12,
    },
    pois: [
      buildPoi({ id: 'aurora-1', name: 'Civil War Fort', category: 'historic.fort' }),
      buildPoi({ id: 'aurora-2', name: 'Mountain Overlook', category: 'scenic.viewpoint' }),
      buildPoi({ id: 'aurora-3', name: 'Wildflower Meadow', category: 'nature.meadow' }),
    ],
    attribution: { source: 'Trip Narrator' },
  },
  {
    routeId: 'route-horizon',
    polyline: '[]',
    geometry: { type: 'LineString', coordinates: [] },
    durationMinutes: 224,
    distanceKm: 352,
    score: 0.78,
    scoreNormalized: 0.81,
    scoreRank: 2,
    scoreBreakdown: {
      poiCount: 0.7,
      interestAlignment: 0.83,
      diversity: 0.65,
      durationPenalty: 0.18,
    },
    pois: [
      buildPoi({ id: 'horizon-1', name: 'Craft Coffee Roastery', category: 'sustenance.cafe' }),
      buildPoi({ id: 'horizon-2', name: 'Indie Book Nook', category: 'culture.bookshop' }),
      buildPoi({ id: 'horizon-3', name: 'Riverwalk Promenade', category: 'scenic.walk' }),
    ],
    attribution: { source: 'Trip Narrator' },
  },
  {
    routeId: 'route-express',
    polyline: '[]',
    geometry: { type: 'LineString', coordinates: [] },
    durationMinutes: 198,
    distanceKm: 320,
    score: 0.73,
    scoreNormalized: 0.75,
    scoreRank: 3,
    scoreBreakdown: {
      poiCount: 0.6,
      interestAlignment: 0.7,
      diversity: 0.68,
      durationPenalty: 0.08,
    },
    pois: [
      buildPoi({
        id: 'express-1',
        name: 'Express Path Scenic Pullout',
        category: 'scenic.viewpoint',
      }),
      buildPoi({ id: 'express-2', name: 'Midnight Drive-In', category: 'sustenance.diner' }),
      buildPoi({ id: 'express-3', name: 'Historic Railway Depot', category: 'historic.depot' }),
    ],
    attribution: { source: 'Trip Narrator' },
  },
];

export const narrationTimeline = [
  {
    id: 'timeline-1',
    title: 'Civil War Fort',
    eta: 'In 12 min',
    distance: '6.4 km',
    categories: ['Historic', 'Guided'],
  },
  {
    id: 'timeline-2',
    title: 'Mountain Overlook',
    eta: 'In 24 min',
    distance: '12.2 km',
    categories: ['Scenic', 'Sunrise'],
  },
  {
    id: 'timeline-3',
    title: 'Indie Vinyl Shop',
    eta: 'In 36 min',
    distance: '20.1 km',
    categories: ['Culture', 'Music'],
  },
];

export const suggestionPhrases = [
  'Preview story',
  'Compare scenic vs fastest',
  'Show accessible stops',
  'Add family-friendly detours',
];

export const heroRoutes = [
  {
    id: 'hero-main',
    color: 'rgba(99, 102, 241, 0.95)',
    path: 'M180 720 C 360 540, 520 500, 780 580 S 1140 520, 1400 360',
  },
  {
    id: 'hero-alt',
    color: 'rgba(14, 165, 233, 0.85)',
    path: 'M200 680 C 420 620, 600 460, 840 420 S 1180 420, 1440 280',
  },
  {
    id: 'hero-alt-2',
    color: 'rgba(236, 72, 153, 0.7)',
    path: 'M220 700 C 380 520, 540 480, 760 500 S 1180 460, 1460 340',
  },
];

export const mapHighlights = [
  { id: 'hl-1', label: '3h 45m', position: { x: 980, y: 420 } },
  { id: 'hl-2', label: '245 km', position: { x: 480, y: 340 } },
];
