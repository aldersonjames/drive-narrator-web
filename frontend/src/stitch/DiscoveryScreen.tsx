import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { HeroMap } from '../components/map/HeroMap';
import { RouteCarousel } from '../components/routes/RouteCarousel';
import { useTripPlanner } from '../context/TripPlannerContext';
import { VoiceOutputService } from '../services/voice/voiceOutputService';

const DEFAULT_PROFILE_ID = 'traveler-001';
const DEFAULT_ORIGIN = 'Waxhaw, NC';
const DEFAULT_DESTINATION = 'Boone, NC';

interface DiscoveryCard {
  id: string;
  poiId: string;
  name: string;
  category: string;
  categories: string[];
  summary: string;
  narrationPreview: string;
  coordinate: [number, number] | null;
  geometry?: unknown;
  images: string[];
  relevance: number;
}

const toLngLat = (value: unknown): [number, number] | null => {
  if (Array.isArray(value) && value.length >= 2) {
    const lng = Number(value[0]);
    const lat = Number(value[1]);
    return Number.isFinite(lng) && Number.isFinite(lat) ? [lng, lat] : null;
  }

  if (value && typeof value === 'object') {
    const { lat, lng } = value as { lat?: number; lng?: number };
    if (typeof lat === 'number' && typeof lng === 'number') {
      return [lng, lat];
    }
  }

  return null;
};

export const DiscoveryScreen: React.FC = () => {
  const {
    routes,
    selectedRouteId,
    preferences,
    isLoading,
    loadRoutes,
    loadPreferences,
    updatePreferences,
    selectRoute,
  } = useTripPlanner();

  const navigate = useNavigate();
  const profileId = useMemo(() => preferences?.profileId ?? DEFAULT_PROFILE_ID, [preferences]);
  const metadata = preferences?.metadata;

  const [originInput, setOriginInput] = useState<string>(DEFAULT_ORIGIN);
  const [destinationInput, setDestinationInput] = useState<string>(DEFAULT_DESTINATION);
  const [interestsInput, setInterestsInput] = useState<string>('');
  const [planError, setPlanError] = useState<string | undefined>();
  const [discoveries, setDiscoveries] = useState<DiscoveryCard[]>([]);
  const [loadingPois, setLoadingPois] = useState<boolean>(false);
  const [poisError, setPoisError] = useState<string | undefined>();
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const favoriteIds = useRef<Set<string>>(new Set());
  const initialRoutesRequested = useRef(false);
  const voiceServiceRef = useRef(new VoiceOutputService());

  useEffect(() => {
    void loadPreferences(profileId).catch(() => undefined);
  }, [loadPreferences, profileId]);

  useEffect(() => {
    const watchId = navigator.geolocation?.watchPosition?.(
      (pos) => {
        setCurrentLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
    return () => {
      if (watchId !== undefined && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    favoriteIds.current = new Set(metadata?.favoritePoiIds ?? []);
  }, [metadata?.favoritePoiIds]);

  useEffect(() => {
    if (initialRoutesRequested.current) return;
    const interestTags = preferences?.interestTags ?? [];
    if (!originInput || !destinationInput) return;
    initialRoutesRequested.current = true;
    void loadRoutes({
      origin: originInput,
      destination: destinationInput,
      departureTime: new Date().toISOString(),
      interestTags,
    }).catch(() => undefined);
  }, [preferences?.interestTags, loadRoutes, originInput, destinationInput]);

  const persistFavorites = (ids: string[]) => {
    void updatePreferences(profileId, { metadata: { favoritePoiIds: ids } }).catch(() => undefined);
  };

  const toggleFavorite = (poiId: string) => {
    const next = new Set(favoriteIds.current);
    if (next.has(poiId)) {
      next.delete(poiId);
    } else {
      next.add(poiId);
    }
    favoriteIds.current = next;
    persistFavorites(Array.from(next));
  };

  const handlePlanRoute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlanError(undefined);
    const manualTags = interestsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const interestTags = manualTags.length ? manualTags : (preferences?.interestTags ?? []);

    if (!originInput || !destinationInput) {
      setPlanError('Please enter both origin and destination.');
      return;
    }

    try {
      await loadRoutes({
        origin: originInput,
        destination: destinationInput,
        departureTime: new Date().toISOString(),
        interestTags,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setPlanError((error as Error).message);
    }
  };

  useEffect(() => {
    const fetchPois = async () => {
      if (!selectedRouteId) return;
      try {
        setLoadingPois(true);
        setPoisError(undefined);
        const interestTags = preferences?.interestTags ?? [];
        const params = new URLSearchParams({ routeId: selectedRouteId, limit: '10' });
        if (interestTags.length) {
          params.set('interests', interestTags.join(','));
        }
        const response = await fetch(`/api/pois?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load POIs: ${response.status}`);
        }
        const payload = (await response.json()) as { pois?: unknown[] };
        const cards: DiscoveryCard[] = (payload.pois ?? []).map((poi) => {
          const record = poi as Record<string, unknown>;
          const coordinate = toLngLat(record.coordinates);

          const imageList = Array.isArray(record.images)
            ? (record.images as unknown[])
                .map((image) => (image as { url?: string })?.url)
                .filter((url): url is string => typeof url === 'string' && Boolean(url))
            : [];

          const fallbackId =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

          return {
            id: String(record.id ?? record.poiId ?? fallbackId),
            poiId: String(record.poiId ?? record.id ?? ''),
            name: String(record.name ?? ''),
            category: String(record.category ?? ''),
            categories: Array.isArray(record.categories)
              ? (record.categories as unknown[]).filter(
                  (entry): entry is string => typeof entry === 'string',
                )
              : [],
            summary: String(record.summary ?? ''),
            narrationPreview: String(record.narrationPreview ?? ''),
            coordinate,
            geometry: record.geometry,
            images: imageList,
            relevance: typeof record.relevance === 'number' ? record.relevance : 0,
          };
        });

        setDiscoveries(cards);
      } catch (error) {
        setPoisError((error as Error).message);
      } finally {
        setLoadingPois(false);
      }
    };

    void fetchPois();
  }, [selectedRouteId, preferences?.interestTags]);

  const heroRoutes = useMemo(
    () =>
      routes.map((route, index) => ({
        id: route.routeId,
        color: index === 0 ? '#f5a623' : '#8884ff',
        geometry: route.geometry,
      })),
    [routes],
  );

  const callouts = useMemo(
    () =>
      discoveries
        .filter((poi) => poi.coordinate)
        .map((poi) => ({
          id: poi.poiId,
          label: poi.name,
          detail: poi.summary || poi.narrationPreview,
          coordinate: poi.coordinate as [number, number],
          color: '#ffffff',
        })),
    [discoveries],
  );

  const mapCenter = useMemo<[number, number]>(() => {
    const firstRoute = routes[0];
    const coords = firstRoute?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length) {
      const mid = coords[Math.floor(coords.length / 2)];
      const lngLat = toLngLat(mid);
      if (lngLat) {
        return lngLat;
      }
    }
    return [-80.743, 34.924];
  }, [routes]);

  const handlePlay = (poi: DiscoveryCard) => {
    const voiceId = preferences?.narrationVoiceId ?? 'narrator-default';
    void voiceServiceRef.current.speak({
      id: poi.poiId,
      text: poi.summary || poi.narrationPreview,
      voiceId,
    });
    navigate('/now-playing', { state: { poi } });
  };

  const isFavorite = (poiId: string) => favoriteIds.current.has(poiId);

  return (
    <div
      className="flex min-h-screen flex-col bg-background-light font-display text-stone-900 dark:bg-background-dark dark:text-stone-100"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <div className="relative h-64 w-full overflow-hidden">
        <HeroMap
          routes={heroRoutes}
          center={mapCenter}
          zoom={9}
          currentLocation={
            currentLocation
              ? { label: 'You are here', coordinate: currentLocation }
              : { label: 'Start', coordinate: mapCenter }
          }
          callouts={callouts}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h1 className="text-xl font-bold text-white">Discoveries</h1>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl">
          <div className="px-4 pt-6">
            <form onSubmit={handlePlanRoute} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={originInput}
                  onChange={(event) => setOriginInput(event.target.value)}
                  placeholder="Starting point"
                  className="flex-1 rounded-lg border border-primary/30 bg-white/90 px-3 py-2 text-sm text-stone-900 placeholder-stone-500 shadow-sm focus:border-primary focus:outline-none dark:bg-background-dark/80 dark:text-stone-100"
                />
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(event) => setDestinationInput(event.target.value)}
                  placeholder="Destination"
                  className="flex-1 rounded-lg border border-primary/30 bg-white/90 px-3 py-2 text-sm text-stone-900 placeholder-stone-500 shadow-sm focus:border-primary focus:outline-none dark:bg-background-dark/80 dark:text-stone-100"
                />
              </div>
              <input
                type="text"
                value={interestsInput}
                onChange={(event) => setInterestsInput(event.target.value)}
                placeholder="Interest tags (comma separated)"
                className="w-full rounded-lg border border-primary/30 bg-white/90 px-3 py-2 text-sm text-stone-900 placeholder-stone-500 shadow-sm focus:border-primary focus:outline-none dark:bg-background-dark/80 dark:text-stone-100"
              />
              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-primary/80"
                >
                  Plan route
                </button>
                {planError && (
                  <span className="text-sm text-red-600 dark:text-red-400">{planError}</span>
                )}
              </div>
            </form>
          </div>

          {routes.length > 0 && (
            <div className="px-4 pt-4">
              <RouteCarousel
                routes={routes}
                selectedRouteId={selectedRouteId}
                onSelect={selectRoute}
              />
            </div>
          )}

          <div className="px-4 pb-2 pt-6">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
              {loadingPois || isLoading
                ? 'Loading discoveries…'
                : 'Here’s what I discovered for you'}
            </h2>
          </div>

          <div className="space-y-4 p-4">
            {loadingPois || isLoading ? (
              <p className="text-center text-sm text-stone-500 dark:text-stone-400">Loading…</p>
            ) : poisError ? (
              <p className="text-center text-sm text-red-600 dark:text-red-400">{poisError}</p>
            ) : discoveries.length === 0 ? (
              <p className="text-center text-sm text-stone-500 dark:text-stone-400">
                No discoveries found for this route.
              </p>
            ) : (
              discoveries.map((poi) => (
                <div key={poi.id} className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {poi.category || poi.categories[0] || 'Point of interest'}
                      </p>
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        {poi.name}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {poi.summary || poi.narrationPreview}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePlay(poi)}
                        className="flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-sm font-medium text-primary transition-colors dark:bg-primary/30"
                      >
                        <span className="material-symbols-outlined">play_arrow</span>
                        <span>Play</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(poi.poiId)}
                        className={`text-sm transition-colors ${
                          isFavorite(poi.poiId)
                            ? 'text-primary'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                        aria-label={
                          isFavorite(poi.poiId) ? 'Remove from favorites' : 'Add to favorites'
                        }
                      >
                        <span className="material-symbols-outlined">
                          {isFavorite(poi.poiId) ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div
                    className="h-28 w-28 shrink-0 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: poi.images[0] ? `url("${poi.images[0]}")` : undefined,
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 bg-background-light/80 backdrop-blur-sm dark:bg-background-dark/80">
        <div className="mx-auto flex max-w-4xl justify-around border-t border-primary/20 p-2">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-full p-2 transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">compass_calibration</span>
            <span className="text-xs font-medium">Discoveries</span>
          </NavLink>
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">bookmark</span>
            <span className="text-xs font-medium">Trips</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </div>
      </footer>
    </div>
  );
};

export default DiscoveryScreen;
