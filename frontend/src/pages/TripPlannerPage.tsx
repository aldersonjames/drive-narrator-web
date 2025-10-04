import React, { useMemo, useState } from 'react';

import { useDrivePlanner } from '../context/DrivePlannerContext';
import { MapRoutes } from '../components/map/MapRoutes';
import { NarrationTimeline } from '../components/voice/NarrationTimeline';
import { ConversationConsole } from '../components/voice/ConversationConsole';
import { StoryHighlights } from '../components/routes/StoryHighlights';

export const TripPlannerPage: React.FC = () => {
  const { routes, loadRoutes, selectRoute, selectedRouteId, notices, isLoading } = useDrivePlanner();
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
    <section className="trip-planner-page">
      <div className="planner-panel">
        <header className="planner-header">
          <h1>Plan your route</h1>
          <p>
            Pick destinations and interests; Drive Narrator will scout scenic alternatives and
            story-rich stops.
          </p>
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

      <div className="planner-column">
        <div className="conversation-panel">
          <ConversationConsole
            route={selectedRoute}
            interestTags={parsedInterests}
            profileId="traveler-001"
          />
        </div>

        <div className="map-panel">
          <header>
            <h2>Route options</h2>
          </header>
          <MapRoutes
            routes={routes}
            selectedRouteId={selectedRoute?.routeId}
            onSelect={selectRoute}
          />
        </div>

        <StoryHighlights route={selectedRoute} isLoading={isLoading && !routes.length} />

        <div className="timeline-panel">
          <h2>Narration preview</h2>
          <NarrationTimeline route={selectedRoute} />
        </div>
      </div>
    </section>
  );
};

export default TripPlannerPage;
