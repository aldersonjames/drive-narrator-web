import request from 'supertest';

import app from '../../src/api/app';

describe('Voice selection + transcript integration', () => {
  it('applies selected personas and persists transcript metadata', async () => {
    const preferences = await request(app)
      .patch('/api/preferences')
      .set('x-traveler-id', 'traveler-voice')
      .send({
        assistantVoiceId: 'assistant-calm',
        narrationVoiceId: 'narrator-story',
        transcriptOptIn: true,
      });

    expect(preferences.status).toBe(200);

    const narration = await request(app)
      .post('/api/narrations')
      .set('x-traveler-id', 'traveler-voice')
      .send({
        tripId: 'trip-voice',
        poiId: 'poi-voice',
      });

    expect(narration.status).toBe(201);
    expect(narration.body).toMatchObject({
      narrationId: expect.any(String),
      voice: 'narrator-story',
      transcriptPath: expect.stringContaining('trip-voice'),
    });
  });
});
