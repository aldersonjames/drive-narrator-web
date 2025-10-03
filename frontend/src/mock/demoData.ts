import type { LineString } from 'geojson';

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

export interface HeroRouteConfig {
  id: string;
  color: string;
  geometry: LineString;
}

export interface HeroCalloutConfig {
  id: string;
  label: string;
  detail?: string;
  coordinate: [number, number];
  color?: string;
}

export interface HeroMapConfig {
  center: [number, number];
  zoom: number;
  currentLocation: {
    label: string;
    coordinate: [number, number];
  };
  callouts: HeroCalloutConfig[];
}

export const heroRoutes: HeroRouteConfig[] = [
  {
    id: 'routeA',
    color: '#00E5FF',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-80.743, 34.924],
        [-80.843, 35.227],
        [-81.254, 35.473],
        [-81.341, 35.733],
        [-81.677, 36.135],
        [-81.674, 36.216],
      ],
    },
  },
  {
    id: 'routeB',
    color: '#FF6EC7',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-80.743, 34.924],
        [-80.843, 35.227],
        [-80.889, 35.781],
        [-81.15, 36.145],
        [-81.563, 36.231],
        [-81.674, 36.216],
      ],
    },
  },
  {
    id: 'routeC',
    color: '#FFB020',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-80.743, 34.924],
        [-81.187, 35.262],
        [-81.536, 35.292],
        [-81.538, 35.914],
        [-81.674, 36.216],
      ],
    },
  },
];

export const heroMapConfig: HeroMapConfig = {
  center: [-81.1, 35.6],
  zoom: 7.2,
  currentLocation: {
    label: 'Near Waxhaw, NC',
    coordinate: [-80.743, 34.924],
  },
  callouts: [
    {
      id: 'routeA',
      label: 'Scenic Ridge',
      detail: 'Waxhaw → Boone',
      coordinate: [-81.25, 35.9],
      color: '#00E5FF',
    },
    {
      id: 'routeB',
      label: 'Statesville Run',
      detail: 'Waxhaw → Boone',
      coordinate: [-81.1, 35.95],
      color: '#FF6EC7',
    },
    {
      id: 'routeC',
      label: 'Foothills Sweep',
      detail: 'Waxhaw → Boone',
      coordinate: [-81.5, 35.5],
      color: '#FFB020',
    },
  ],
};
