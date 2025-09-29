import React, { useMemo, useState } from 'react';

import { useTripPlanner } from '../context/TripPlannerContext';
import { MapRoutes } from '../components/map/MapRoutes';
import { NarrationTimeline } from '../components/voice/NarrationTimeline';
import { ConversationConsole } from '../components/voice/ConversationConsole';

export const TripPlannerPage: React.FC = () => {
  const { routes, loadRoutes, selectRoute, selectedRouteId, notices, isLoading } = useTripPlanner();
  const [origin, setOrigin] = useState('Austin, TX');
  const [destination, setDestination] = useState('Santa Fe, NM');
  const [interests, setInterests] = useState('scenic,cultural');

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
  const parsedInterests = useMemo(
    () =>
      interests
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    [interests],
  );

  return (
    <section
      className="trip-planner-page"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2.5rem',
        padding: '2.5rem clamp(1.5rem, 4vw, 3.5rem)',
        background: '#F8FAFC',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <header>
          <h1 style={{ marginBottom: '0.35rem', fontSize: '1.9rem' }}>Plan your route</h1>
          <p style={{ margin: 0, color: '#64748B' }}>
            Pick destinations and interests; Trip Narrator will scout scenic alternatives and
            story-rich stops.
          </p>
        </header>

        <form
          className="trip-form"
          onSubmit={handleSubmit}
          style={{ display: 'grid', gap: '1rem' }}
        >
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
          </div>
        </form>

        {notices.length > 0 && (
          <aside className="trip-notices" role="alert">
            <ul>
              {notices.map((notice) => (
                <li key={notice.code}>{notice.message}</li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        <ConversationConsole
          route={selectedRoute}
          interestTags={parsedInterests}
          profileId="traveler-001"
        />

        <MapRoutes
          routes={routes}
          selectedRouteId={selectedRoute?.routeId}
          onSelect={selectRoute}
        />

        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '18px',
            padding: '1.75rem',
            boxShadow: '0 18px 46px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Narration preview</h2>
          <NarrationTimeline route={selectedRoute} />
        </div>
      </div>
    </section>
  );
};

export default TripPlannerPage;
