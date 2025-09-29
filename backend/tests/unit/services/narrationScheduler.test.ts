import { describe, expect, it } from '@jest/globals';

import { NarrationScheduler } from '../../../src/services/narration/narrationScheduler';

describe('narrationScheduler', () => {
  it('delays narrations until adequate lead time and queues immediate POIs when needed', () => {
    const scheduler = new NarrationScheduler();
    const now = new Date();
    const tripStart = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const result = scheduler.schedule({
      tripStart,
      pois: [
        { poiId: 'poi-near', etaOffsetSeconds: 60 },
        { poiId: 'poi-far', etaOffsetSeconds: 900 },
      ],
    });

    expect(result.events).toHaveLength(2);
    expect(result.queuedImmediately).toContain('poi-near');
    expect(result.queuedImmediately).not.toContain('poi-far');
  });
});
