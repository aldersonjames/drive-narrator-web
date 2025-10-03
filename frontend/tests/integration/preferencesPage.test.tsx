import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PreferencesPage } from '../../src/pages/PreferencesPage';
import { TripPlannerProvider } from '../../src/context/TripPlannerContext';

describe('PreferencesPage integration', () => {
  it('allows selecting voices, toggling transcripts, and persists state', async () => {
    const user = userEvent.setup();
    const basePreferences = {
      profileId: 'traveler-001',
      assistantVoiceId: 'assistant-default',
      narrationVoiceId: 'narrator-default',
      interestTags: ['historic'],
      transcriptOptIn: false,
      retentionDays: 30,
      poiProvider: 'ops' as const,
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

    let currentPreferences = basePreferences;

    const jsonResponse = (payload: unknown, status = 200) => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    });

    const mockFetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = init?.method ?? 'GET';

      if (url.includes('/api/preferences') && method === 'GET') {
        return jsonResponse(currentPreferences);
      }

      if (url.includes('/api/preferences') && method === 'PATCH') {
        const bodyJson = typeof init?.body === 'string' ? init.body : '';
        const body = bodyJson ? (JSON.parse(bodyJson) as Record<string, unknown>) : {};

        currentPreferences = {
          ...currentPreferences,
          assistantVoiceId:
            (body.assistantVoiceId as string | undefined) ?? currentPreferences.assistantVoiceId,
          narrationVoiceId:
            (body.narrationVoiceId as string | undefined) ?? currentPreferences.narrationVoiceId,
          transcriptOptIn:
            typeof body.transcriptOptIn === 'boolean'
              ? (body.transcriptOptIn as boolean)
              : currentPreferences.transcriptOptIn,
          poiProvider:
            (body.poiProvider as typeof currentPreferences.poiProvider | undefined) ??
            currentPreferences.poiProvider,
        };

        return jsonResponse(currentPreferences);
      }

      return jsonResponse('Not Found', 404);
    });

    const originalFetch = globalThis.fetch;
    (globalThis as { fetch: typeof fetch }).fetch = mockFetch as unknown as typeof fetch;

    render(
      <TripPlannerProvider>
        <PreferencesPage />
      </TripPlannerProvider>,
    );

    try {
      const assistantSelect = await screen.findByLabelText(/assistant voice/i);

      await user.selectOptions(assistantSelect, ['assistant-calm']);
      await user.selectOptions(screen.getByLabelText(/narrator voice/i), ['narrator-story']);
      await user.click(screen.getByLabelText(/receive narrated transcripts/i));
      await user.click(screen.getByRole('button', { name: /save preferences/i }));

      expect((assistantSelect as HTMLSelectElement).value).toBe('assistant-calm');
      await screen.findByText(/Narrator ready:/i);

      const patchCall = mockFetch.mock.calls.find(([, init]) => init?.method === 'PATCH');
      expect(patchCall).toBeDefined();

      const patchBody = JSON.parse((patchCall?.[1]?.body as string) ?? '{}');
      expect(patchBody).toMatchObject({
        assistantVoiceId: 'assistant-calm',
        narrationVoiceId: 'narrator-story',
        transcriptOptIn: true,
      });
    } finally {
      if (originalFetch) {
        globalThis.fetch = originalFetch;
      } else {
        delete (globalThis as { fetch?: typeof fetch }).fetch;
      }
    }
  });
});
