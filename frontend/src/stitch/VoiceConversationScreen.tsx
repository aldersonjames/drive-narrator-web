import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

import BreathingOrb from '../components/voice/BreathingOrb';
import MapRoutes from '../components/map/MapRoutes';
import { useTripPlanner } from '../context/TripPlannerContext';
import { useVoiceConversation } from '../hooks/useVoiceConversation';

type ReverseGeocodeResponse = {
  address?: {
    road?: string;
    house_number?: string;
  };
};

const geoToString = (coords: [number, number]): string =>
  `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`;

const formatAddress = (data?: ReverseGeocodeResponse, coords?: [number, number]): string => {
  if (data?.address) {
    const { house_number, road } = data.address;
    if (road && house_number) {
      return `${house_number} ${road}`;
    }
    if (road) {
      return road;
    }
  }
  return coords ? geoToString(coords) : 'Location unavailable';
};

const reverseGeocode = async ([lng, lat]: [number, number]): Promise<
  ReverseGeocodeResponse | undefined
> => {
  try {
    const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lng) });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TripNarrator/0.1 (demo)',
        },
      },
    );
    if (!response.ok) {
      return undefined;
    }
    const data = (await response.json()) as ReverseGeocodeResponse;
    return data;
  } catch (error) {
    console.info('reverse-geocode-failed', error);
    return undefined;
  }
};

const geocodePlace = async (value: string): Promise<[number, number] | null> => {
  try {
    const params = new URLSearchParams({ format: 'jsonv2', q: value, limit: '1' });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'TripNarrator/0.1 (demo)',
        },
      },
    );
    if (!response.ok) {
      return null;
    }
    const result = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const top = result[0];
    const lat = top?.lat ? Number.parseFloat(top.lat) : undefined;
    const lon = top?.lon ? Number.parseFloat(top.lon) : undefined;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return [lon as number, lat as number];
    }
    return null;
  } catch (error) {
    console.info('geocode-failed', error);
    return null;
  }
};

export const VoiceConversationScreen: React.FC = () => {
  const { routes, isLoading, loadRoutes, preferences, selectRoute, selectedRouteId, notices } =
    useTripPlanner();

  const [originInput, setOriginInput] = useState('Current Location');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState('Locating…');
  const [planDestinationInput, setPlanDestinationInput] = useState('');
  const [plannerError, setPlannerError] = useState<string | undefined>();
  const [planning, setPlanning] = useState(false);

  const interestTags = preferences?.interestTags ?? ['scenic'];
  const profileId = preferences?.profileId ?? 'traveler-001';

  const selectedRoute = useMemo(() => {
    if (!routes.length) return undefined;
    return routes.find((route) => route.routeId === selectedRouteId) ?? routes[0];
  }, [routes, selectedRouteId]);

  const conversation = useVoiceConversation({
    route: selectedRoute,
    interestTags,
    profileId,
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationLabel('Location unavailable');
      return;
    }

    let cancelled = false;

    const handlePosition = (pos: GeolocationPosition) => {
      if (cancelled) return;
      const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
      setOriginCoords(coords);
      setOriginInput('Current Location');
      setLocationLabel(geoToString(coords));

      void reverseGeocode(coords).then((address) => {
        if (cancelled) return;
        setLocationLabel(formatAddress(address, coords));
      });
    };

    const handleError = () => {
      if (!cancelled) {
        setLocationLabel('Location unavailable');
      }
    };

    const watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => {
      cancelled = true;
      if (typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const handlePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const destinationText = planDestinationInput.trim();
    if (!destinationText) {
      setPlannerError('Enter a destination to plan your trip.');
      return;
    }

    setPlannerError(undefined);
    setPlanning(true);
    try {
      let originValue = originCoords ? geoToString(originCoords) : originInput.trim();
      if (!originCoords && originValue) {
        const originLookup = await geocodePlace(originValue);
        if (originLookup) {
          originValue = geoToString(originLookup);
        }
      }

      const destinationLookup = await geocodePlace(destinationText);
      const destinationValue = destinationLookup ? geoToString(destinationLookup) : destinationText;

      if (!originValue) {
        setPlannerError('Provide an origin to begin planning.');
        setPlanning(false);
        return;
      }

      await loadRoutes({
        origin: originValue,
        destination: destinationValue,
        departureTime: new Date().toISOString(),
        interestTags,
      });
    } catch (error) {
      setPlannerError((error as Error).message || 'Unable to plan route.');
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div
      className="flex h-full min-h-screen flex-col bg-background-light font-display text-white dark:bg-background-dark"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <header className="p-4 pb-0">
        <div className="flex justify-center">
          <div className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
            <span role="img" aria-hidden="true" className="mr-1">
              📍
            </span>
            {locationLabel}
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-6">
        <section className="flex justify-center pt-4">
          <BreathingOrb
            phase={conversation.orbState}
            onStartListening={conversation.startVoice}
            onStop={conversation.stopVoice}
            disabled={conversation.isProcessing}
            messages={{
              idle: conversation.error ? 'Ready when you are' : 'Tap to start listening',
              listening: 'Listening…',
              speaking: 'Narrating…',
              processing: 'Processing…',
              error: conversation.error ?? 'Microphone problem',
            }}
          />
        </section>

        {conversation.error && (
          <p className="text-center text-sm text-rose-300" role="alert">
            {conversation.error}
          </p>
        )}

        <section className="rounded-2xl bg-white/5 p-4 backdrop-blur dark:bg-white/10">
          <form className="space-y-3" onSubmit={handlePlan}>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col text-left text-white/70">
                <span className="text-xs uppercase tracking-wide">Origin</span>
                <input
                  value={originInput}
                  onChange={(event) => {
                    setOriginInput(event.target.value);
                    setOriginCoords(null);
                  }}
                  placeholder="Current Location"
                  className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber focus:outline-none"
                />
              </label>
              <label className="flex flex-col text-left text-white/70">
                <span className="text-xs uppercase tracking-wide">Destination</span>
                <input
                  value={planDestinationInput}
                  onChange={(event) => setPlanDestinationInput(event.target.value)}
                  placeholder="Where are you headed?"
                  className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/40 focus:border-amber focus:outline-none"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={planning || isLoading}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-white/20"
              >
                {planning || isLoading ? 'Planning…' : 'Plan Trip'}
              </button>
            </div>
          </form>
          {plannerError && (
            <p className="mt-2 text-sm text-rose-300" role="alert">
              {plannerError}
            </p>
          )}
          {notices.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-white/60">
              {notices.map((notice) => (
                <li key={notice.code}>{notice.message}</li>
              ))}
            </ul>
          )}
        </section>

        {routes.length > 0 && (
          <section className="rounded-2xl bg-white/5 p-4 backdrop-blur dark:bg-white/10">
            <MapRoutes
              routes={routes}
              selectedRouteId={selectedRoute?.routeId}
              onSelect={selectRoute}
            />
          </section>
        )}
      </main>

      <footer className="flex-shrink-0 border-t border-white/10 bg-background-light/5 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/5">
        <nav className="flex justify-around p-2">
          <NavLink
            to="/voice"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">home</span>
            <span className="text-xs font-medium">Home</span>
          </NavLink>
          <NavLink
            to="/discoveries"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">compass_calibration</span>
            <span className="text-xs font-medium">Discover</span>
          </NavLink>
          <NavLink
            to="/trips"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">bookmark</span>
            <span className="text-xs font-medium">Trips</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors ${
                isActive ? 'text-primary' : 'text-white/60 dark:text-white/60 hover:text-primary'
              }`
            }
          >
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium">Settings</span>
          </NavLink>
        </nav>
        <div className="h-safe-bottom" aria-hidden="true" />
      </footer>
    </div>
  );
};

export default VoiceConversationScreen;
