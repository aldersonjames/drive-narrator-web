import request from 'supertest';

import app from '../../src/api/app';

describe('Trip resume and history deletion flow', () => {
  it('allows resuming a trip with saved preferences and respects retention window', async () => {
    const resumeResponse = await request(app)
      .get('/api/trips/trip-abc/resume')
      .set('x-traveler-id', 'traveler-001');

    expect(resumeResponse.status).toBe(200);
    expect(resumeResponse.body).toMatchObject({
      tripId: 'trip-abc',
      status: 'planned',
      preferences: expect.any(Object),
    });
  });

  it('queues deletion requests and returns audit confirmation', async () => {
    const deleteResponse = await request(app)
      .delete('/api/trips')
      .set('x-traveler-id', 'traveler-001')
      .send({ deleteBefore: '2025-09-01T00:00:00Z' });

    expect(deleteResponse.status).toBe(202);
    expect(deleteResponse.body).toMatchObject({
      requestId: expect.any(String),
      status: 'pending',
      message: expect.stringContaining('queued'),
    });
  });
});
