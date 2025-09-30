import { describe, expect, it } from '@jest/globals';
import request from 'supertest';

import app from '../../src/api/app';

describe('PATCH /api/preferences contract', () => {
  it('updates interest taxonomy and voices, returning new profile snapshot', async () => {
    const response = await request(app)
      .patch('/api/preferences')
      .set('x-traveler-id', 'traveler-001')
      .send({
        assistantVoiceId: 'assistant-serene',
        narrationVoiceId: 'narrator-storyteller',
        interestTags: ['historical', 'scenic'],
        transcriptOptIn: true,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      profileId: 'traveler-001',
      assistantVoiceId: 'assistant-serene',
      narrationVoiceId: 'narrator-storyteller',
      interestTags: ['historical', 'scenic'],
      transcriptOptIn: true,
      updatedAt: expect.any(String),
    });
  });

  it('accepts deletion requests and returns confirmation response', async () => {
    const response = await request(app)
      .patch('/api/preferences')
      .set('x-traveler-id', 'traveler-001')
      .send({ deleteProfile: true });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      status: 'pending-deletion',
      message: expect.stringContaining('deletion requested'),
    });
  });

  it('rejects invalid voice IDs', async () => {
    const response = await request(app)
      .patch('/api/preferences')
      .set('x-traveler-id', 'traveler-001')
      .send({ assistantVoiceId: 'unknown-voice' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'INVALID_VOICE_SELECTION',
    });
  });
});
