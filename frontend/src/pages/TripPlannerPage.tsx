import React, { useState } from 'react';

import { useTripPlanner } from '../context/TripPlannerContext';
import BreathingOrb from '../components/voice/BreathingOrb';
import { MapRoutes } from '../components/map/MapRoutes';
import { NarrationTimeline } from '../components/voice/NarrationTimeline';
import { useVoiceInput } from '../hooks/useVoiceInput';

export const TripPlannerPage: React.FC = () => {
  const { routes, loadRoutes, selectRoute, selectedRouteId, notices, isLoading } = useTripPlanner();
  const [origin, setOrigin] = useState('Austin, TX');
  const [destination, setDestination] = useState('Santa Fe, NM');
  const [interests, setInterests] = useState('scenic,cultural');

  const voiceInput = useVoiceInput({ language: 'en-US' });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const interestTags = interests
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    await loadRoutes({
      origin,
      destination,
      departureTime: new Date().toISOString(),
      interestTags,
    });
  };

  const selectedRoute = routes.find((route) => route.routeId === selectedRouteId) ?? routes[0];

  return (
    <section className="trip-planner-page">
      <header>
        <h1>Trip Narrator Planner</h1>
      </header>

      <form className="trip-form" onSubmit={handleSubmit}>
        <label>
          Origin
          <input
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
            placeholder="Origin"
          />
        </label>
        <label>
          Destination
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="Destination"
          />
        </label>
        <label>
          Interests
          <input
            value={interests}
            onChange={(event) => setInterests(event.target.value)}
            placeholder="historical, scenic"
          />
        </label>
        <div className="trip-form__actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Planning…' : 'Plan trip'}
          </button>
          <button
            type="button"
            onClick={voiceInput.startListening}
            disabled={!voiceInput.isSupported}
          >
            Use voice
          </button>
        </div>
      </form>

      <BreathingOrb
        status={
          voiceInput.status === 'error'
            ? 'error'
            : voiceInput.status === 'listening'
              ? 'listening'
              : 'idle'
        }
      />

      {voiceInput.transcript && (
        <p className="transcript">
          <strong>Transcript:</strong> {voiceInput.transcript}
        </p>
      )}

      {notices.length > 0 && (
        <aside className="trip-notices" role="alert">
          <ul>
            {notices.map((notice) => (
              <li key={notice.code}>{notice.message}</li>
            ))}
          </ul>
        </aside>
      )}

      <MapRoutes routes={routes} selectedRouteId={selectedRoute?.routeId} onSelect={selectRoute} />

      <h2>Narration preview</h2>
      <NarrationTimeline route={selectedRoute} />
    </section>
  );
};

export default TripPlannerPage;
