import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

import BreathingOrb from '../components/voice/BreathingOrb';
import RouteCarousel from '../components/routes/RouteCarousel';
import { useTripPlanner } from '../context/TripPlannerContext';
import { useVoiceConversation } from '../hooks/useVoiceConversation';

const geoToString = (coords: [number, number]): string =>
  `${coords[1].toFixed(5)},${coords[0].toFixed(5)}`;

export const VoiceConversationScreen: React.FC = () => {
  const { routes, isLoading, loadRoutes, preferences, selectRoute, selectedRouteId, notices } =
    useTripPlanner();

  const [originInput, setOriginInput] = useState('Current Location');
  const [originCoords, setOriginCoords] = useState<[number, number] | null>(null);
  const [locationLabel, setLocationLabel] = useState('Locating…');
  const [planDestinationInput, setPlanDestinationInput] = useState('');
  const [conversationInput, setConversationInput] = useState('');
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        setOriginCoords(coords);
        setLocationLabel(
          `Current location • ${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`,
        );
        setOriginInput('Current Location');
      },
      () => {
        setLocationLabel('Use voice or enter an origin');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  const handlePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const destination = planDestinationInput.trim();
    if (!destination) {
      setPlannerError('Enter a destination to plan your trip.');
      return;
    }

    const originValue = originCoords ? geoToString(originCoords) : originInput.trim();
    if (!originValue) {
      setPlannerError('Provide an origin to begin planning.');
      return;
    }

    setPlannerError(undefined);
    setPlanning(true);
    try {
      await loadRoutes({
        origin: originValue,
        destination,
        departureTime: new Date().toISOString(),
        interestTags,
      });
    } catch (error) {
      setPlannerError((error as Error).message || 'Unable to plan route.');
    } finally {
      setPlanning(false);
    }
  };

  const formattedMetrics = selectedRoute
    ? {
        duration: `${selectedRoute.durationMinutes.toFixed(0)} min drive`,
        distance: `${selectedRoute.distanceKm.toFixed(0)} km`,
        stops: `${selectedRoute.pois.length} narrated stops`,
      }
    : undefined;

  const suggestions = conversation.suggestions.length
    ? conversation.suggestions
    : ['Preview story', 'Add a scenic detour', 'Share accessibility options'];

  return (
    <div
      className="flex h-full min-h-screen flex-col bg-background-light font-display text-white dark:bg-background-dark"
      style={{ minHeight: 'max(884px, 100dvh)' }}
    >
      <header className="flex flex-col gap-4 p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80 backdrop-blur">
            <span role="img" aria-hidden="true" className="mr-1">
              📍
            </span>
            {locationLabel}
          </div>
          <button type="button" className="text-white/70" aria-label="Open settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="w-full rounded-2xl bg-white/5 p-4 shadow-sm backdrop-blur dark:bg-white/10">
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-xs text-white/60">
                {originCoords
                  ? `Using GPS • ${geoToString(originCoords)}`
                  : 'Edit origin to override GPS'}
              </div>
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
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-4 pb-4">
        {(planning || routes.length > 0) && (
          <section className="rounded-2xl bg-white/5 p-4 backdrop-blur dark:bg-white/10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">Route options</h2>
              {formattedMetrics && (
                <div className="flex flex-wrap gap-3 text-xs text-white/60">
                  <span>{formattedMetrics.duration}</span>
                  <span>{formattedMetrics.distance}</span>
                  <span>{formattedMetrics.stops}</span>
                </div>
              )}
            </div>
            <div className="mt-4">
              <RouteCarousel
                routes={routes}
                selectedRouteId={selectedRoute?.routeId}
                onSelect={selectRoute}
              />
            </div>
          </section>
        )}

        <section className="flex flex-col items-center gap-6 rounded-2xl bg-white/5 px-6 py-8 text-center backdrop-blur dark:bg-white/10">
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

          <div className="w-full max-w-md space-y-4">
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                const trimmed = conversationInput.trim();
                if (trimmed) {
                  void conversation.sendText(trimmed);
                  setConversationInput('');
                }
              }}
            >
              <input
                type="text"
                placeholder="Speak or type to your co-pilot…"
                value={conversationInput}
                onChange={(event) => setConversationInput(event.target.value)}
                disabled={conversation.isProcessing}
                className="w-full rounded-lg border border-white/10 bg-background-dark/40 py-3 px-4 text-white placeholder-white/40 focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/60"
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-amber"
                aria-label="Send message"
                disabled={!conversationInput.trim() || conversation.isProcessing}
              >
                <span className="material-symbols-outlined">arrow_upward</span>
              </button>
            </form>
            <ul className="flex flex-wrap justify-center gap-2 text-xs text-white/70">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => void conversation.sendText(suggestion)}
                    className="rounded-full bg-white/10 px-3 py-1 transition-colors hover:bg-white/20"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {conversation.error && (
        <div className="px-4 py-2 text-center text-sm text-red-400" role="alert">
          {conversation.error}
        </div>
      )}

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
