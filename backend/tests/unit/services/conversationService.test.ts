import { describe, expect, it } from '@jest/globals';

import { ConversationService } from '../../../src/services/voice/conversationService';

describe('ConversationService', () => {
  const service = new ConversationService();

  it('crafts an assistant reply that references interests and route name', () => {
    const payload = service.generateReply({
      message: 'Can we slow down near the overlook?',
      route: { name: 'Blue Ridge Parkway', poiCount: 4 },
      interestTags: ['scenic', 'history'],
    });

    expect(payload.turn.role).toBe('assistant');
    expect(payload.turn.text).toEqual(expect.stringContaining('Blue Ridge Parkway'));
    expect(payload.turn.text.toLowerCase()).toEqual(expect.stringContaining('scenic'));
    expect(payload.audioSegments).toHaveLength(1);
    expect(payload.followUps.length).toBeGreaterThan(0);
  });

  it('falls back to generic guidance when no context provided', () => {
    const payload = service.generateReply({
      message: 'Thanks!',
    });

    expect(payload.turn.text).toEqual(expect.stringContaining('trip'));
    expect(payload.followUps[0]).toEqual(expect.any(String));
  });
});
