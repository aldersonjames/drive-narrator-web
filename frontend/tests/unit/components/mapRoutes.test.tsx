import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

import { MapRoutes } from '../../../src/components/map/MapRoutes';
import type { RouteSummary } from '../../../../shared/types/tripNarrator';

const createMapMock = () => {
  const mockCanvas = { style: {} as Record<string, string> };
  const mapMock = {
    on: jest.fn((event: string, layerOrHandler?: unknown, handler?: unknown) => {
      const callback = typeof layerOrHandler === 'function' ? layerOrHandler : handler;
      if (event === 'load' && typeof callback === 'function') {
        callback();
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
  it('renders route cards and legend items', () => {
    const makeRoute = (overrides: Partial<RouteSummary>): RouteSummary => ({
      routeId: 'route-1',
      polyline: '[]',
      geometry: { type: 'LineString', coordinates: [] },
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

    const routes: RouteSummary[] = [
      makeRoute({ routeId: 'route-1' }),
      makeRoute({ routeId: 'route-2', score: 0.65, scoreNormalized: 0.65, scoreRank: 2 }),
    ];

    render(<MapRoutes routes={routes} selectedRouteId="route-1" onSelect={() => {}} />);

    expect(screen.getByText('Route 1')).toBeInTheDocument();
    expect(screen.getByText('Route 2')).toBeInTheDocument();
  });
});
