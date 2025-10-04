import React, { useEffect, useMemo, useRef, useState } from 'react';

import BreathingOrb from '../components/voice/BreathingOrb';
import HeroMap from '../components/map/HeroMap';
import RouteCarousel from '../components/routes/RouteCarousel';
import TranscriptRibbon from '../components/transcript/TranscriptRibbon';
import NarrationTimeline from '../components/timeline/NarrationTimeline';
import { heroRoutes as fallbackHeroRoutes, heroMapConfig } from '../mock/demoData';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import { useAudioMeter } from '../hooks/useAudioMeter';
import { useTripPlanner } from '../context/TripPlannerContext';
import { buildStoryTimeline } from './launchTimelineUtils';

const FALLBACK_SUGGESTIONS = [
  'Preview story',
  'Compare scenic vs fastest',
  'Show accessible stops',
  'Add family-friendly detours',
];

const DEFAULT_INTEREST_TAGS = ['scenic', 'historic', 'storytelling'];
const DEFAULT_ORIGIN = 'Charlotte, NC';
const DEFAULT_DESTINATION = 'Boone, NC';
const HERO_ROUTE_PALETTE = ['#00E5FF', '#FF6EC7', '#FFB020'];

export const LaunchExperience: React.FC = () => {
  const locationLabel = heroMapConfig.currentLocation.label;
  const {
    routes,
    isLoading,
    loadRoutes,
    selectRoute,
    selectedRouteId,
    preferences,
    loadPreferences,
  } = useTripPlanner();
  const [isTranscriptVisible, setTranscriptVisible] = useState(false);
  const lastInterestKeyRef = useRef<string | null>(null);
  const preferencesRequestRef = useRef(false);

  useEffect(() => {
    if (preferencesRequestRef.current) return;
    preferencesRequestRef.current = true;
    void loadPreferences('traveler-001');
  }, [loadPreferences]);

  useEffect(() => {
    const interestTags = (
      preferences?.interestTags?.length ? preferences.interestTags : DEFAULT_INTEREST_TAGS
    ).map((tag) => tag.toLowerCase());
    const key = interestTags.join('|');

    if (isLoading) {
      return;
    }

    if (lastInterestKeyRef.current === key && routes.length) {
      return;
    }

    lastInterestKeyRef.current = key;
    void loadRoutes({
      origin: DEFAULT_ORIGIN,
      destination: DEFAULT_DESTINATION,
      departureTime: new Date().toISOString(),
      interestTags,
    });
  }, [preferences?.interestTags, loadRoutes, routes.length, isLoading]);

  const selectedRoute = useMemo(() => {
    if (!routes.length) return undefined;
    return routes.find((route) => route.routeId === selectedRouteId) ?? routes[0];
  }, [routes, selectedRouteId]);

  const conversation = useVoiceConversation({
    route: selectedRoute,
    interestTags: preferences?.interestTags ?? DEFAULT_INTEREST_TAGS,
    profileId: preferences?.profileId ?? 'traveler-001',
  });
  const {
    level: micLevel,
    error: micLevelError,
    start: startMeter,
    stop: stopMeter,
  } = useAudioMeter();

  useEffect(() => {
    if (conversation.transcript) {
      setTranscriptVisible(true);
    }
  }, [conversation.transcript]);

  const suggestionItems = conversation.suggestions.length
    ? conversation.suggestions
    : FALLBACK_SUGGESTIONS;

  const handleOrbTap = () => {
    if (conversation.micStatus === 'listening') {
      conversation.stopVoice();
      stopMeter();
    } else if (!conversation.isProcessing) {
      startMeter().finally(() => {
        conversation.startVoice();
      });
    }
  };

  useEffect(() => {
    if (conversation.micStatus !== 'listening') {
      stopMeter();
    }
  }, [conversation.micStatus, stopMeter]);

  const heroRoutes = useMemo(() => {
    if (!routes.length) {
      return fallbackHeroRoutes;
    }
    return routes.slice(0, HERO_ROUTE_PALETTE.length).map((route, index) => ({
      id: route.routeId,
      color: HERO_ROUTE_PALETTE[index % HERO_ROUTE_PALETTE.length],
      geometry: route.geometry,
    }));
  }, [routes]);

  const timelineItems = useMemo(() => buildStoryTimeline(selectedRoute), [selectedRoute]);

  const primaryRouteTitle = selectedRoute?.pois?.[0]?.name ?? 'Curated Journey';
  const primaryMetrics = selectedRoute
    ? {
        durationMinutes: `${selectedRoute.durationMinutes.toFixed(0)} min drive`,
        distanceKm: `${selectedRoute.distanceKm.toFixed(0)} km`,
        score: `Score ${selectedRoute.scoreNormalized.toFixed(2)}`,
      }
    : undefined;

  const journeyPrompt = `Ask for stories along ${DEFAULT_ORIGIN} to ${DEFAULT_DESTINATION}`;
  const isPollingRoutes = isLoading && !routes.length;

  return (
    <div className="launch-shell">
      <div className="launch-hero">
        <div className="hero-map-layer" aria-hidden="true" />
        <div className="launch-location-chip">
          <span role="img" aria-hidden="true">
            📍
          </span>
          {locationLabel}
        </div>
        <div className="launch-orb-wrapper">
          <BreathingOrb phase={conversation.orbState} caption="" onTap={handleOrbTap} />
        </div>
        <div className="mic-debug">
          Mic: {conversation.micStatus}
          {conversation.micError ? ` – ${conversation.micError}` : ''}
          {micLevelError ? ` – ${micLevelError}` : ''}
          <div className="mic-level" aria-hidden="true">
            <div
              className="mic-level-bar"
              style={{ transform: `scaleX(${micLevel.toFixed(2)})` }}
            />
          </div>
        </div>
        <div className="launch-hero-map">
          <HeroMap
            routes={heroRoutes}
            center={heroMapConfig.center}
            zoom={heroMapConfig.zoom}
            currentLocation={heroMapConfig.currentLocation}
            callouts={heroMapConfig.callouts}
          />
        </div>
      </div>

      <div className="launch-lower">
        <TranscriptRibbon
          text={conversation.transcript || journeyPrompt}
          visible={isTranscriptVisible}
          onDismiss={() => setTranscriptVisible(false)}
        />

        <ul className="suggestion-row">
          {suggestionItems.map((suggestion) => (
            <li key={suggestion}>
              <button type="button" className="suggestion-chip">
                {suggestion}
              </button>
            </li>
          ))}
        </ul>

        <div className="route-stage">
          <section className="primary-card" aria-live="polite">
            <header>
              <div>
                <span className="alt-route-rank">Primary Route</span>
                <h2>{primaryRouteTitle}</h2>
              </div>
              <button type="button" className="suggestion-chip">
                Preview story
              </button>
            </header>
            <div className="primary-metrics">
              {primaryMetrics ? (
                <>
                  <span className="metric-chip">{primaryMetrics.durationMinutes}</span>
                  <span className="metric-chip">{primaryMetrics.distanceKm}</span>
                  <span className="metric-chip">{primaryMetrics.score}</span>
                </>
              ) : (
                <span className="metric-chip">Scouting the best storyteller routes…</span>
              )}
            </div>
          </section>

          {routes.length ? (
            <RouteCarousel
              routes={routes}
              selectedRouteId={selectedRoute?.routeId}
              onSelect={selectRoute}
            />
          ) : (
            <div className="route-loading" role="status">
              {isPollingRoutes
                ? 'Gathering scenic story routes…'
                : 'Routes will appear here once we map the storytelling detours.'}
            </div>
          )}
        </div>

        <NarrationTimeline
          items={timelineItems}
          phase={
            conversation.orbState === 'speaking'
              ? 'speaking'
              : conversation.orbState === 'processing'
                ? 'processing'
                : 'idle'
          }
        />
      </div>
    </div>
  );
};

export default LaunchExperience;
