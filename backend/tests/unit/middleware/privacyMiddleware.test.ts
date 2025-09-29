import type { Request, Response } from 'express';
import { describe, expect, it, jest } from '@jest/globals';

import { createPrivacyMiddleware } from '../../../src/api/middleware/privacyMiddleware';

const createProfile = (
  overrides: Partial<{ consent_version: string; deleted_at: string | null }> = {},
) => ({
  profile_id: 'traveler-001',
  consent_version: overrides.consent_version ?? '1.0.0',
  deleted_at: overrides.deleted_at ?? null,
});

describe('privacyMiddleware', () => {
  it('allows requests for active profiles with valid consent', async () => {
    const middleware = createPrivacyMiddleware({
      travelerProfilesRepo: {
        findById: jest.fn().mockResolvedValue(createProfile()),
      },
      minimumConsentVersion: '1.0.0',
    });

    const req = { headers: { 'x-profile-id': 'traveler-001' } } as unknown as Request;
    const res = {
      status: jest.fn(() => ({ json: jest.fn() })),
    } as unknown as Response;
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('blocks deleted profiles', async () => {
    const json = jest.fn();
    const middleware = createPrivacyMiddleware({
      travelerProfilesRepo: {
        findById: jest
          .fn()
          .mockResolvedValue(createProfile({ deleted_at: new Date().toISOString() })),
      },
    });

    const req = { headers: { 'x-profile-id': 'traveler-001' } } as unknown as Request;
    const res = { status: jest.fn(() => ({ json })) } as unknown as Response;

    await middleware(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(423);
    expect(json).toHaveBeenCalled();
  });
});
