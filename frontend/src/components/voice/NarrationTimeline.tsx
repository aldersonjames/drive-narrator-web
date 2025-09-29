import React from 'react';

import type { RouteSummary } from '../../../../shared/types/tripNarrator';

export interface NarrationTimelineProps {
  route?: RouteSummary;
}

export const NarrationTimeline: React.FC<NarrationTimelineProps> = ({ route }) => {
  if (!route) {
    return <p role="note">Select a route to preview upcoming narrations.</p>;
  }

  if (!route.pois.length) {
    return <p role="note">No narrations are scheduled on this route yet.</p>;
  }

  return (
    <ol className="narration-timeline">
      {route.pois.map((poi) => (
        <li key={poi.id ?? poi.poiId} className="narration-timeline__item">
          <h4>{poi.name}</h4>
          <p>{poi.summary}</p>
          <small>{poi.attribution.provider.toUpperCase()}</small>
        </li>
      ))}
    </ol>
  );
};

export default NarrationTimeline;
