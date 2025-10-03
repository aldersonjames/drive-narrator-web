import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { StoryHighlights } from '../../../src/components/routes/StoryHighlights';
import type { RouteSummary } from '../../../../shared/types/tripNarrator';

const buildRoute = (overrides: Partial<RouteSummary> = {}): RouteSummary => ({
  routeId: 'route-1',
  polyline: '[]',
  geometry: { type: 'LineString', coordinates: [] },
  durationMinutes: 120,
  distanceKm: 180,
  score: 0.85,
  scoreNormalized: 0.92,
  scoreRank: 1,
  scoreBreakdown: {
    poiCount: 0.9,
    interestAlignment: 0.88,
    diversity: 0.7,
    durationPenalty: 0.1,
  },
  pois: [
    {
      id: 'poi-1',
      name: 'Cider Mill Tales',
      poiId: 'poi-1',
      category: 'culture.story',
      categories: ['culture.story', 'sustenance.cider'],
      relevance: 0.92,
      coordinates: { lat: 0, lng: 0 },
      geometry: { type: 'Point', coordinates: [0, 0] },
      summary: 'Stories brewed with heirloom apples.',
      narrationPreview: 'Stories brewed with heirloom apples.',
      attribution: { provider: 'trip-narrator' },
      images: [],
    },
  ],
  attribution: { source: 'Trip Narrator' },
  ...overrides,
});

describe('StoryHighlights', () => {
  it('renders traveller-facing placeholders while loading', () => {
    render(<StoryHighlights isLoading />);
    expect(screen.getByText(/Gathering storyteller gems/i)).toBeInTheDocument();
  });

  it('shows story beats with formatted categories when route data exists', () => {
    render(<StoryHighlights route={buildRoute()} />);
    expect(screen.getByRole('heading', { name: /story highlights/i })).toBeInTheDocument();
    expect(screen.getByText(/Cider Mill Tales/)).toBeInTheDocument();
    expect(screen.getByText(/Stories brewed/)).toBeInTheDocument();
    expect(screen.getByText(/Culture Story/)).toBeInTheDocument();
  });
});
