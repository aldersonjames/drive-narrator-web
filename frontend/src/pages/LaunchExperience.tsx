import React, { useMemo, useState } from 'react';

import BreathingOrb from '../components/voice/BreathingOrb';
import HeroMap from '../components/map/HeroMap';
import RouteCarousel from '../components/routes/RouteCarousel';
import TranscriptRibbon from '../components/transcript/TranscriptRibbon';
import NarrationTimeline from '../components/timeline/NarrationTimeline';
import { demoRoutes, narrationTimeline, heroRoutes, mapHighlights } from '../mock/demoData';
import { useDemoVoice } from '../hooks/useDemoVoice';

const locationLabel = 'Austin, TX';

export const LaunchExperience: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(demoRoutes[0].routeId);
  const voice = useDemoVoice();

  const selectedRoute = useMemo(
    () => demoRoutes.find((route) => route.routeId === selectedRouteId) ?? demoRoutes[0],
    [selectedRouteId],
  );

  return (
    <div className="launch-shell">
      <div className="launch-hero">
        <div className="hero-map-layer" aria-hidden="true" />
        <HeroMap routes={heroRoutes} highlights={mapHighlights} />
        <div className="launch-orb-wrapper">
          <BreathingOrb
            phase={voice.phase}
            caption={voice.phase === 'idle' ? 'Tap to share your vibe' : undefined}
            subCaption="Voice-first co-pilot"
            onTap={() => undefined}
          />
        </div>
        <div className="launch-meta-banner">
          <div className="location-chip">
            <span role="img" aria-hidden="true">
              📍
            </span>
            Near {locationLabel}
          </div>
          <h1>Listening for your next trip…</h1>
          <p>Tell Trip Narrator where you want to roam or the stories you want to hear.</p>
        </div>
      </div>

      <div className="launch-lower">
        <TranscriptRibbon
          text={voice.transcript || 'Find routes with historic sites'}
          visible={voice.isRibbonVisible}
          onDismiss={voice.acknowledge}
        />

        <ul className="suggestion-row">
          {voice.suggestions.map((suggestion) => (
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
                <h2>{selectedRoute.pois[0]?.name ?? 'Scenic Heritage Trail'}</h2>
              </div>
              <button type="button" className="suggestion-chip">
                Preview story
              </button>
            </header>
            <div className="primary-metrics">
              <span className="metric-chip">
                {selectedRoute.durationMinutes.toFixed(0)} min drive
              </span>
              <span className="metric-chip">{selectedRoute.distanceKm.toFixed(0)} km</span>
              <span className="metric-chip">Score {selectedRoute.scoreNormalized.toFixed(2)}</span>
            </div>
          </section>

          <RouteCarousel
            routes={demoRoutes}
            selectedRouteId={selectedRouteId}
            onSelect={setSelectedRouteId}
          />
        </div>

        <NarrationTimeline
          items={narrationTimeline}
          phase={
            voice.phase === 'processing'
              ? 'processing'
              : voice.phase === 'speaking'
                ? 'speaking'
                : 'idle'
          }
        />
      </div>
    </div>
  );
};

export default LaunchExperience;
