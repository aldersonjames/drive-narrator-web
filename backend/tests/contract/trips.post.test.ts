import { describe, expect, it } from '@jest/globals';
import request from 'supertest';

// Placeholder Express app import
import app from '../../src/api/app';

describe('POST /api/trips contract', () => {
  it('requires consent, persists trip metadata, and guards against duplicate pending trip requests', async () => {
    const payload = {
      profileId: 'traveler-001',
      origin: 'Chicago, IL',
      destination: 'Nashville, TN',
      departureTime: '2025-10-02T14:30:00Z',
      interests: ['music', 'historical'],
      consentVersion: '1.0.0',
    };

    const createResponse = await request(app).post('/api/trips').send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      tripId: expect.any(String),
      status: 'planned',
      profileId: payload.profileId,
      createdAt: expect.any(String),
    });

    const duplicateResponse = await request(app).post('/api/trips').send(payload);
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body).toMatchObject({
      code: 'TRIP_ALREADY_PENDING',
      message: expect.stringContaining('Existing pending trip'),
    });
  });

  it('rejects trip creation when consent metadata missing', async () => {
    const response = await request(app)
      .post('/api/trips')
      .send({
        profileId: 'traveler-001',
        origin: 'Chicago, IL',
        destination: 'Nashville, TN',
        departureTime: '2025-10-02T14:30:00Z',
        interests: ['music'],
      });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      code: 'CONSENT_REQUIRED',
      message: expect.stringContaining('consent'),
    });
  });
});
