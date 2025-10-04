import React from 'react';

interface TimelineItem {
  id: string;
  title: string;
  eta: string;
  distance: string;
  categories: string[];
}

export interface NarrationTimelineProps {
  items: TimelineItem[];
  phase: 'idle' | 'listening' | 'processing' | 'speaking';
}

export const NarrationTimeline: React.FC<NarrationTimelineProps> = ({ items, phase }) => {
  const etaLabel =
    phase === 'speaking'
      ? 'Narrating now'
      : phase === 'processing'
        ? 'Preparing narration'
        : 'Upcoming';

  return (
    <section className="timeline-sheet" aria-label="Narration timeline">
      <div className="timeline-header">
        <div>
          <h3>Next narrations</h3>
          <span>{etaLabel}</span>
        </div>
        <div className="toggle-output" aria-hidden="true">
          <span>Output:</span>
          <strong>Car speakers</strong>
        </div>
      </div>
      <ul className="timeline-list">
        {items.map((item) => (
          <li key={item.id} className="timeline-item">
            <div>
              <strong>{item.title}</strong>
              <span>{item.categories.join(' • ')}</span>
            </div>
            <div>
              <strong>{item.eta}</strong>
              <span>{item.distance}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default NarrationTimeline;
