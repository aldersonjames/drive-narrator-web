import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';

import type { PreferencesPayload } from '../../../../shared/types/tripNarrator';

describe('PreferencesPage provider toggle', () => {
  const mockUseTripPlanner = jest.fn();

  jest.unstable_mockModule('../../../src/context/TripPlannerContext', () => ({
    useTripPlanner: mockUseTripPlanner,
  }));

  const loadPage = async (preferences: PreferencesPayload) => {
    mockUseTripPlanner.mockReturnValue({
      isLoading: false,
      notices: [],
      routes: [],
      selectedRouteId: undefined,
      trips: [],
      preferences,
      loadRoutes: jest.fn(),
      loadTrips: jest.fn(),
      loadPreferences: jest.fn(),
      updatePreferences: jest.fn(),
      selectRoute: jest.fn(),
    });

    const { default: Component } = await import('../../../src/pages/PreferencesPage');
    render(<Component />);
  };

  const basePreferences: PreferencesPayload = {
    profileId: 'traveler-001',
    assistantVoiceId: 'assistant-default',
    narrationVoiceId: 'narrator-default',
    interestTags: ['historic'],
    transcriptOptIn: true,
    retentionDays: 30,
    poiProvider: 'ops',
    providerCapabilities: {
      ops: {
        available: true,
        locked: false,
        label: 'Open POI Service',
        description: 'Open data backed by OpenPoiService with curated taxonomy mapping.',
      },
      foursquare: {
        available: false,
        locked: true,
        label: 'Foursquare Places',
        description: 'Connect a Foursquare Places API key to unlock premium metadata.',
      },
    },
  };

  afterEach(() => {
    jest.resetModules();
    mockUseTripPlanner.mockReset();
  });

  it('disables the Foursquare option when credentials are missing', async () => {
    await loadPage(basePreferences);

    const foursquareRadio = screen.getByRole('radio', { name: /foursquare places/i });
    expect(foursquareRadio).toBeDisabled();
    expect(screen.getByText(/connect a foursquare places api key/i)).toBeInTheDocument();
  });

  it('enables the Foursquare option when credentials are present', async () => {
    const unlockedPreferences: PreferencesPayload = {
      ...basePreferences,
      poiProvider: 'foursquare',
      providerCapabilities: {
        ...basePreferences.providerCapabilities,
        foursquare: {
          available: true,
          locked: false,
          label: 'Foursquare Places',
          description: 'Enriched ratings and imagery from Foursquare Places.',
        },
      },
    };

    await loadPage(unlockedPreferences);

    const foursquareRadio = screen.getByRole('radio', { name: /foursquare places/i });
    expect(foursquareRadio).not.toBeDisabled();
  });
});
