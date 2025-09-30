import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

import { MapRoutes } from '../../../src/components/map/MapRoutes';
import type { PoiSummary, RouteSummary } from '../../../../shared/types/tripNarrator';

const createMapMock = () => {
  const mockCanvas = { style: {} as Record<string, string> };
  const mapMock = {
    on: jest.fn((event: string, layerOrHandler?: unknown, handler?: unknown) => {
      const callback = typeof layerOrHandler === 'function' ? layerOrHandler : handler;
      if (event === 'load' && typeof callback === 'function') {
        Promise.resolve().then(() => callback());
      }
      return mapMock;
    }),
    off: jest.fn(() => mapMock),
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => undefined),
    getLayer: jest.fn(() => undefined),
    setFilter: jest.fn(),
    fitBounds: jest.fn(),
    addControl: jest.fn(),
    getCanvas: jest.fn(() => mockCanvas),
    remove: jest.fn(),
  };

  return mapMock;
};

const mapMockInstance = createMapMock();

jest.mock('maplibre-gl', () => ({
  Map: jest.fn(() => mapMockInstance),
  NavigationControl: jest.fn(),
  LngLatBounds: class {
    extend = jest.fn();
    constructor() {
      // no-op
    }
  },
}));

describe('MapRoutes component', () => {
  const makePoi = (overrides: Partial<PoiSummary> = {}): PoiSummary => {
    const baseId = overrides.id ?? 'poi-1';
    const baseImage = overrides.images ?? [
      {
        url: 'https://example.com/photo.jpg',
        altText: `${overrides.name ?? 'Scenic Overlook'} preview`,
      },
    ];

    return {
      id: baseId,
      poiId: overrides.poiId ?? baseId,
      name: 'Scenic Overlook',
      category: 'scenic.viewpoint',
      categories: ['scenic'],
      relevance: 1,
      coordinates: { lat: 35.0, lng: -110.0 },
      geometry: { type: 'Point', coordinates: [-110.0, 35.0] },
      summary: 'Beautiful overlook.',
      attribution: { provider: 'openpoiservice' },
      images: baseImage as PoiSummary['images'],
      ...overrides,
    };
  };

  const makeRoute = (overrides: Partial<RouteSummary>): RouteSummary => ({
    routeId: 'route-1',
    polyline: '[]',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-110, 35],
        [-109, 35.2],
      ],
    },
    durationMinutes: 120,
    distanceKm: 200,
    score: 0.85,
    scoreNormalized: 1,
    scoreRank: 1,
    scoreBreakdown: {
      poiCount: 0.8,
      interestAlignment: 0.9,
      diversity: 0.7,
      durationPenalty: 0.1,
    },
    pois: [],
    attribution: { source: 'openrouteservice' },
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mapMockInstance.getSource.mockReturnValue(undefined);
  });

  it('renders route cards, photostrips, and extra counts', async () => {
    const routes: RouteSummary[] = [
      makeRoute({
        routeId: 'route-1',
        pois: [
          makePoi({ id: 'poi-1', poiId: 'poi-1' }),
          makePoi({
            id: 'poi-2',
            poiId: 'poi-2',
            name: 'Museum Hall',
            category: 'arts.museum',
            images: [],
          }),
          makePoi({
            id: 'poi-3',
            poiId: 'poi-3',
            name: 'Cafe Bright',
            category: 'sustenance.cafe',
            images: [{ url: 'https://example.com/cafe.jpg', altText: 'Cafe Bright preview' }],
          }),
          makePoi({
            id: 'poi-4',
            poiId: 'poi-4',
            name: 'Lakeside Park',
            category: 'leisure.park',
            images: [{ url: 'https://example.com/park.jpg', altText: 'Lakeside Park preview' }],
          }),
        ],
      }),
    ];

    render(<MapRoutes routes={routes} selectedRouteId="route-1" onSelect={() => {}} />);

    expect(await screen.findByText('Route 1')).toBeInTheDocument();
    expect(await screen.findAllByTestId('poi-photostrip-thumb')).toHaveLength(3);
    expect(screen.getByTestId('poi-photostrip-more')).toHaveTextContent('+1');
    expect(screen.getAllByRole('img', { name: /preview/i })).toHaveLength(2);
  });

  it('invokes onSelect when a route card is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    const routes: RouteSummary[] = [makeRoute({ routeId: 'route-1' })];

    render(<MapRoutes routes={routes} selectedRouteId="route-1" onSelect={onSelect} />);

    await user.click(screen.getByTestId('route-card-route-1'));

    expect(onSelect).toHaveBeenCalledWith('route-1');
  });

  it('renders a friendly note when no routes are available', async () => {
    render(<MapRoutes routes={[]} selectedRouteId={undefined} onSelect={() => {}} />);

    expect(await screen.findByText(/no routes available yet/i)).toBeInTheDocument();
  });
});
