import React, { useEffect, useState, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HeroMap } from '../components/map/HeroMap';
import { RouteCarousel } from '../components/routes/RouteCarousel';
import { useTripPlanner } from '../context/TripPlannerContext';
import { VoiceOutputService } from '../services/voice/voiceOutputService';

// Discovery item shape returned from /api/pois
interface Discovery {
  id: string;
  poiId: string;
  name: string;
  category: string;
  categories: string[];
  relevance: number;
  summary: string;
  /**
   * Geographic coordinates stored as [lng, lat].  These are derived from the
   * PoiSummary coordinates object returned by the backend.  When neither
   * longitude nor latitude are available, the fallback may be [0,0] but
   * callouts should filter undefined coordinates.  Do not rely on this
   * fallback for production use.
   */
  coordinates: [number, number];
  geometry?: any;
  /**
   * Preview of the narration text.  May be omitted when summary is present.
   */
  narrationPreview: string;
  /**
   * List of image URLs extracted from the PoiImage array returned by the
   * backend.  If the POI lacks images this list will be empty.
   */
  images: string[];
}

export const DiscoveryScreen: React.FC = () => {
  // Trip planner integration
  const {
    routes,
    selectedRouteId,
    preferences,
    isLoading: plannerLoading,
    loadRoutes,
    loadPreferences,
    updatePreferences,
    selectRoute,
  } = useTripPlanner();

  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [loadingPois, setLoadingPois] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const navigate = useNavigate();

  // Local set of favorite POI ids, loaded from preferences metadata if available
  const [favoritePoiIds, setFavoritePoiIds] = useState<Set<string>>(new Set());

  // When preferences load or change, initialise the favourite POI set from metadata.
  useEffect(() => {
    const metaFavs = (preferences as any)?.metadata?.favoritePoiIds;
    if (Array.isArray(metaFavs)) {
      setFavoritePoiIds(new Set(metaFavs));
    }
  }, [preferences]);

  // toggle favourite state and persist to preferences metadata
  const toggleFavorite = (poiId: string) => {
    setFavoritePoiIds((prev) => {
      const next = new Set(prev);
      if (next.has(poiId)) {
        next.delete(poiId);
      } else {
        next.add(poiId);
      }
      // persist favorites to backend
      const favArray = Array.from(next);
      void updatePreferences('traveler-001', { metadata: { favoritePoiIds: favArray } }).catch(
        () => undefined,
      );
      return next;
    });
  };

  // Local state for trip planning inputs
  const [originInput, setOriginInput] = useState('Waxhaw, NC');
  const [destinationInput, setDestinationInput] = useState('Boone, NC');
  const [interestsInput, setInterestsInput] = useState('');
  const [planError, setPlanError] = useState<string | undefined>();

  // Track the user's current GPS location. If geolocation is unavailable or denied, this will remain null.
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // Request geolocation updates on mount.
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return undefined;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLocation([pos.coords.longitude, pos.coords.latitude]);
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // voice output service for playing narration previews
  const voiceService = useRef(new VoiceOutputService()).current;

  // load preferences on mount and plan initial route
  useEffect(() => {
    const profileId = 'traveler-001';
    void loadPreferences(profileId).catch(() => undefined);
  }, [loadPreferences]);

  useEffect(() => {
    // when preferences are available, load default route with preference interest tags
    // Only triggers on initial preferences load; do not include originInput/destinationInput in deps
    const origin = originInput;
    const destination = destinationInput;
    const interestTags = preferences?.interestTags ?? [];
    if (!origin || !destination) return;
    void loadRoutes({
      origin,
      destination,
      departureTime: new Date().toISOString(),
      interestTags,
    }).catch(() => undefined);
  }, [loadRoutes, preferences]);

  // handle manual trip planning
  const handlePlanRoute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPlanError(undefined);
    // parse comma-separated interest tags from the input and merge with existing preferences
    const manualTags = interestsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const interestTags = manualTags.length ? manualTags : preferences?.interestTags ?? [];
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
      // scroll to top of page for user feedback
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setPlanError((err as Error).message);
    }
  };

  // whenever route or interests change, fetch POIs
  useEffect(() => {
    const fetchPois = async () => {
      if (!selectedRouteId) return;
      try {
        setLoadingPois(true);
        setError(undefined);
        const interestTags = preferences?.interestTags ?? [];
        const query = new URLSearchParams();
        query.set('routeId', selectedRouteId);
        if (interestTags.length) {
          query.set('interests', interestTags.join(','));
        }
        query.set('limit', '10');
        const res = await fetch(`/api/pois?${query.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to load POIs: ${res.status}`);
        }
        const data = await res.json();
        const rawPois: unknown[] = Array.isArray(data?.pois) ? data.pois : [];
        // Normalize raw POIs into the Discovery shape expected by this screen.
        const normalized: Discovery[] = rawPois.map((poi: any) => {
          const coord = poi?.coordinates;
          let lngLat: [number, number] = [0, 0];
          if (coord && typeof coord === 'object') {
            const lat = coord.lat;
            const lng = coord.lng;
            if (typeof lat === 'number' && typeof lng === 'number') {
              lngLat = [lng, lat];
            }
          } else if (Array.isArray(coord) && coord.length >= 2) {
            // Some implementations may return [lng, lat] directly
            lngLat = [coord[0], coord[1]];
          }
          const images = Array.isArray(poi?.images)
            ? poi.images.map((img: any) => img?.url ?? '').filter(Boolean)
            : [];
          return {
            id: poi?.id ?? poi?.poiId ?? String(Math.random()),
            poiId: poi?.poiId ?? poi?.id ?? '',
            name: poi?.name ?? '',
            category: poi?.category ?? '',
            categories: Array.isArray(poi?.categories) ? poi.categories : [],
            relevance: typeof poi?.relevance === 'number' ? poi.relevance : 0,
            summary: poi?.summary ?? '',
            coordinates: lngLat,
            geometry: poi?.geometry,
            narrationPreview: poi?.narrationPreview ?? '',
            images,
          };
        });
        setDiscoveries(normalized);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoadingPois(false);
      }
    };
    void fetchPois();
  }, [selectedRouteId, preferences]);

  // compute hero map routes and callouts
  const heroRoutes = useMemo(() => {
    return routes.map((route, index) => ({
      id: route.routeId,
      color: index === 0 ? '#f5a623' : '#8884ff',
      geometry: route.geometry,
    }));
  }, [routes]);
  const callouts = useMemo(() => {
    return discoveries.map((poi) => ({
      id: poi.poiId,
      label: poi.name,
      detail: poi.summary ?? poi.narrationPreview,
      coordinate: poi.coordinates,
      color: '#ffffff',
    }));
  }, [discoveries]);

  const center = useMemo(() => {
    if (routes[0]?.geometry?.coordinates?.length) {
      // center on midpoint of route
      const coords = routes[0].geometry.coordinates;
      const mid = Math.floor(coords.length / 2);
      return coords[mid] as [number, number];
    }
    return [-80.743, 34.924]; // fallback to Waxhaw
  }, [routes]);

  const handlePlay = (poi: Discovery) => {
    // speak narration preview using the preferred voice
    const voiceId = preferences?.narrationVoiceId ?? 'narrator-default';
    void voiceService.speak({ id: poi.poiId, text: poi.summary ?? poi.narrationPreview, voiceId });
    // navigate to now playing page with poi details
    navigate('/now-playing', { state: { poi } });
  };

  return (
    <div
      className="flex min-h-screen flex-col bg-background-light font-display text-stone-900 dark:bg-background-dark dark:text-stone-100"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      {/* Map banner with route and POI callouts */}
      <div className="relative h-64 w-full overflow-hidden">
        <HeroMap
          routes={heroRoutes}
          center={center}
          zoom={9}
          currentLocation={
            currentLocation
              ? { label: 'You are here', coordinate: currentLocation }
              : { label: 'Start', coordinate: routes[0]?.geometry?.coordinates?.[0] ?? [-80.743, 34.924] }
          }
          callouts={callouts}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h1 className="text-xl font-bold text-white">Discoveries</h1>
        </div>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl">
          {/* Trip planner form */}
          <div className="px-4 pt-6">
            <form onSubmit={handlePlanRoute} className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  value={originInput}
                  onChange={(e) => setOriginInput(e.target.value)}
                  placeholder="Starting point"
                  className="flex-1 rounded-lg border border-primary/30 bg-white/90 px-3 py-2 text-sm text-stone-900 placeholder-stone-500 shadow-sm focus:border-primary focus:outline-none dark:bg-background-dark/80 dark:text-stone-100"
                />
                <input
                  type="text"
                  value={destinationInput}
                  onChange={(e) => setDestinationInput(e.target.value)}
                  placeholder="Destination"
                  className="flex-1 rounded-lg border border-primary/30 bg-white/90 px-3 py-2 text-sm text-stone-900 placeholder-stone-500 shadow-sm focus:border-primary focus:outline-none dark:bg-background-dark/80 dark:text-stone-100"
                />
              </div>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
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

          {/* Route suggestions carousel */}
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
              {loadingPois || plannerLoading ? 'Loading discoveries…' : 'Here’s what I discovered for you'}
            </h2>
          </div>

          {/* Filter chips (static placeholders for now) */}
          <div className="flex gap-2 overflow-x-auto px-4 pt-2 pb-4">
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Along your route
            </button>
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-background-light px-4 py-2 text-sm font-medium text-stone-700 dark:bg-primary/20 dark:text-stone-200"
            >
              By arrival time
            </button>
            <button
              type="button"
              className="whitespace-nowrap rounded-full bg-background-light px-4 py-2 text-sm font-medium text-stone-700 dark:bg-primary/20 dark:text-stone-200"
            >
              Most interesting
            </button>
          </div>

          <div className="space-y-4 p-4">
            {loadingPois || plannerLoading ? (
              <p className="text-center text-sm text-stone-500 dark:text-stone-400">Loading…</p>
            ) : error ? (
              <p className="text-center text-sm text-red-600 dark:text-red-400">{error}</p>
            ) : (
              discoveries.map((poi) => (
                <div key={poi.poiId} className="flex items-start gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {poi.category ?? poi.categories?.[0]}
                      </p>
                      <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        {poi.name}
                      </h3>
                      <p className="text-sm text-stone-600 dark:text-stone-400">
                        {poi.summary ?? poi.narrationPreview}
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
                        className="text-sm transition-colors"
                        aria-label={favoritePoiIds.has(poi.poiId) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <span className="material-symbols-outlined">
                          {favoritePoiIds.has(poi.poiId) ? 'favorite' : 'favorite_border'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div
                    className="h-28 w-28 shrink-0 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url("${poi.images?.[0] ?? ''}")` }}
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
            to="/memories"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? 'rounded-lg bg-primary/20 text-primary'
                  : 'text-stone-500 dark:text-stone-400 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">bookmark_border</span>
            <span className="text-xs font-medium">Memories</span>
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
