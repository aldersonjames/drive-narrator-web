import React from 'react';

import type { RouteSummary } from '../../../../shared/types/tripNarrator';

export interface MapRoutesProps {
  routes: RouteSummary[];
  selectedRouteId?: string;
  onSelect: (routeId: string) => void;
}

export const MapRoutes: React.FC<MapRoutesProps> = ({ routes, selectedRouteId, onSelect }) => {
  if (!routes.length) {
    return (
      <p role="note">No routes available yet. Try adjusting your interests or destinations.</p>
    );
  }

  return (
    <div className="map-routes">
      <ul>
        {routes.map((route, index) => {
          const isSelected = route.routeId === selectedRouteId;
          return (
            <li key={route.routeId}>
              <button
                type="button"
                onClick={() => onSelect(route.routeId)}
                aria-pressed={isSelected}
                className={isSelected ? 'route-card route-card--active' : 'route-card'}
              >
                <div className="route-card__header">
                  <strong>Route {index + 1}</strong>
                  <span>{route.scoreBreakdown.poiCount} POIs</span>
                </div>
                <p>
                  {route.durationMinutes.toFixed(0)} min · {route.distanceKm.toFixed(1)} km · Score{' '}
                  {route.score.toFixed(2)}
                </p>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MapRoutes;
