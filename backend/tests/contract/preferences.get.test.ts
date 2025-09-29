import request from 'supertest';

// Placeholder app import until backend endpoints are wired
import app from '../../src/api/app';

describe('GET /api/preferences contract', () => {
  it('returns traveler profile preferences with default voices when none stored', async () => {
    const response = await request(app)
      .get('/api/preferences')
      .set('x-traveler-id', 'traveler-001');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      profileId: 'traveler-001',
      assistantVoiceId: expect.any(String),
      narrationVoiceId: expect.any(String),
      interestTags: expect.any(Array),
      consentVersion: expect.any(String),
      updatedAt: expect.any(String),
    });
  });
});
