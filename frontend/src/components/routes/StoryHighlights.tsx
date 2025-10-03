import React, { useMemo } from 'react';

import type { RouteSummary } from '../../../../shared/types/tripNarrator';
import { buildStoryTimeline } from '../../pages/launchTimelineUtils';

export interface StoryHighlightsProps {
  route?: RouteSummary;
  isLoading?: boolean;
}

export const StoryHighlights: React.FC<StoryHighlightsProps> = ({ route, isLoading }) => {
  const stories = useMemo(() => buildStoryTimeline(route).slice(0, 3), [route]);

  if (isLoading) {
    return (
      <section className="story-highlights" aria-live="polite">
        <h2>Story highlights</h2>
        <p className="story-highlights__placeholder">
          Gathering storyteller gems for this journey…
        </p>
      </section>
    );
  }

  if (!route || !stories.length) {
    return (
      <section className="story-highlights" aria-live="polite">
        <h2>Story highlights</h2>
        <p className="story-highlights__placeholder">
          Scout a route to hear the tales waiting between your origin and destination.
        </p>
      </section>
    );
  }

  return (
    <section className="story-highlights" aria-live="polite">
      <h2>Story highlights</h2>
      <ol className="story-highlights__list">
        {stories.map((story) => (
          <li key={story.id} className="story-highlights__item">
            <header>
              <span className="story-highlights__eta">{story.eta}</span>
              <strong>{story.title}</strong>
            </header>
            <p>{story.distance}</p>
            {story.categories.length ? (
              <ul className="story-highlights__tags">
                {story.categories.map((category) => (
                  <li key={category}>{category}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
};

export default StoryHighlights;
