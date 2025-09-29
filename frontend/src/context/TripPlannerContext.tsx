import React, { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';

import type {
  PreferencesPayload,
  RouteSummary,
  TripSummary,
} from '../../../shared/types/tripNarrator';

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
  }
}

export interface PlannerNotice {
  code: string;
  message: string;
}

export interface PlannerState {
  isLoading: boolean;
  notices: PlannerNotice[];
  routes: RouteSummary[];
  selectedRouteId?: string;
  trips: TripSummary[];
  preferences?: PreferencesPayload;
  loadRoutes: (input: {
    origin: string;
    destination: string;
    departureTime?: string;
    interestTags: string[];
  }) => Promise<void>;
  loadTrips: (profileId: string) => Promise<void>;
  updatePreferences: (profileId: string, payload: Partial<PreferencesPayload>) => Promise<void>;
  selectRoute: (routeId?: string) => void;
}

const TripPlannerContext = createContext<PlannerState | undefined>(undefined);

const API_BASE =
  (typeof import.meta !== 'undefined' ? import.meta.env.VITE_API_BASE_URL : undefined) ??
  process.env.REACT_APP_API_BASE_URL ??
  '/api';

async function safeFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || res.statusText);
  }
  return res.json() as Promise<T>;
}

export const TripPlannerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setLoading] = useState(false);
  const [notices, setNotices] = useState<PlannerNotice[]>([]);
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [preferences, setPreferences] = useState<PreferencesPayload | undefined>();

  const loadRoutes = useCallback(
    async (input: {
      origin: string;
      destination: string;
      departureTime?: string;
      interestTags: string[];
    }) => {
      setLoading(true);
      try {
        const payload = await safeFetch<{
          routes: RouteSummary[];
          notices: PlannerNotice[];
          requestId: string;
        }>(`${API_BASE}/routes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            origin: input.origin,
            destination: input.destination,
            departureTime: input.departureTime,
            interests: input.interestTags,
          }),
        });

        setRoutes(payload.routes);
        setNotices(payload.notices ?? []);
        setSelectedRouteId(payload.routes[0]?.routeId);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const loadTrips = useCallback(async (profileId: string) => {
    setLoading(true);
    try {
      const payload = await safeFetch<{ trips: TripSummary[] }>(
        `${API_BASE}/trips?profileId=${encodeURIComponent(profileId)}`,
      );
      setTrips(payload.trips);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePreferences = useCallback(
    async (profileId: string, payload: Partial<PreferencesPayload>) => {
      const next = await safeFetch<PreferencesPayload>(`${API_BASE}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-traveler-id': profileId,
        },
        body: JSON.stringify({
          profileId,
          ...payload,
        }),
      });
      setPreferences(next);
    },
    [],
  );

  const selectRoute = useCallback((routeId?: string) => {
    setSelectedRouteId(routeId);
  }, []);

  const value = useMemo<PlannerState>(
    () => ({
      isLoading,
      notices,
      routes,
      selectedRouteId,
      trips,
      preferences,
      loadRoutes,
      loadTrips,
      updatePreferences,
      selectRoute,
    }),
    [
      isLoading,
      notices,
      routes,
      selectedRouteId,
      trips,
      preferences,
      loadRoutes,
      loadTrips,
      updatePreferences,
      selectRoute,
    ],
  );

  return <TripPlannerContext.Provider value={value}>{children}</TripPlannerContext.Provider>;
};

export const useTripPlanner = (): PlannerState => {
  const context = useContext(TripPlannerContext);
  if (!context) {
    throw new Error('useTripPlanner must be used within a TripPlannerProvider');
  }
  return context;
};
