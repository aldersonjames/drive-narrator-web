import { describe, expect, it } from '@jest/globals';
import request from 'supertest';

import app from '../../src/api/app';

describe('POST /api/conversation contract', () => {
  it('responds with an assistant turn and audio segments', async () => {
    const response = await request(app)
      .post('/api/conversation')
      .set('x-traveler-id', 'traveler-001')
      .send({
        message: 'Can you highlight scenic stops?',
        interestTags: ['scenic', 'nature'],
        routeName: 'Blue Ridge Parkway',
      });

    expect(response.status).toBe(200);

    const payload = response.body as {
      turn: { id: string; role: string; text: string };
      audioSegments: Array<{ id: string; voiceId: string; text: string }>;
      followUps: string[];
    };

    expect(payload.turn).toMatchObject({
      role: 'assistant',
      text: expect.any(String),
    });
    expect(payload.audioSegments[0]).toMatchObject({
      voiceId: expect.any(String),
      text: expect.any(String),
    });
    expect(payload.followUps.length).toBeGreaterThan(0);
  });
});
