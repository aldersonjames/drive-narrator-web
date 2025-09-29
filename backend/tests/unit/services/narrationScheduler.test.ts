import { describe, expect, it } from '@jest/globals';

// Placeholder import
import { scheduleNarrations } from '../../../src/services/narration/narrationScheduler';

describe('narrationScheduler', () => {
  it('delays narrations until adequate lead time and queues immediate POIs when needed', () => {
    const tripContext = {
      routeId: 'route-123',
      departureTime: '2025-10-04T12:00:00Z',
      pois: [
        { poiId: 'poi-near', etaOffsetSeconds: 60 },
        { poiId: 'poi-far', etaOffsetSeconds: 900 },
      ],
    };

    expect(() => scheduleNarrations(tripContext)).toThrow();
    // TODO: replace with concrete assertions once implementation exists
  });
});
