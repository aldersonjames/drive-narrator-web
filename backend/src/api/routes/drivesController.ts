import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';

import type { DrivesRepository } from '../../db/repositories/drivesRepository';
import type { RouteOptionsRepository } from '../../db/repositories/routeOptionsRepository';
import type { PointsOfInterestRepository } from '../../db/repositories/pointsOfInterestRepository';
import type { NarrationSessionsRepository } from '../../db/repositories/narrationSessionsRepository';
import type { PreferencesService } from '../../services/preferences/preferencesService';
import type { DeletionService } from '../../services/privacy/deletionService';
import { validate } from '../../utils/validation';

interface Dependencies {
  drivesRepo: Pick<DrivesRepository, 'create' | 'findActiveByProfile' | 'findById' | 'update'>;
  routeOptionsRepo: Pick<RouteOptionsRepository, 'findByDriveId' | 'deleteByDriveId'>;
  poiRepo: Pick<PointsOfInterestRepository, 'deleteByRouteId'>;
  narrationRepo: Pick<NarrationSessionsRepository, 'deleteByDriveId'>;
  preferencesService: PreferencesService;
  deletionService: DeletionService;
}

const toSummary = (record: {
  drive_id: string;
  profile_id: string;
  origin_raw: string;
  destination_raw: string;
  departure_time: string;
  interest_tags: string;
  status: string;
  created_at: string;
  updated_at: string;
}) => ({
  driveId: record.drive_id,
  profileId: record.profile_id,
  origin: record.origin_raw,
  destination: record.destination_raw,
  departureTime: record.departure_time,
  interestTags: JSON.parse(record.interest_tags ?? '[]'),
  status: record.status,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

const interestArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .flatMap((entry) => (typeof entry === 'string' ? entry.split(',') : []))
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean);
  }
  return [];
};

const createDriveSchema = z.object({
  profileId: z.string().optional(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  departureTime: z.string().optional(),
  interestTags: z.array(z.string().min(1)).min(1),
  consentVersion: z.string().min(1),
});

export const createDrivesRouter = (deps: Dependencies): Router => {
  const router = Router();

  const resolveProfileId = (res: Response, fallback?: string): string | undefined => {
    const locals = res.locals as { privacy?: { profileId: string } };
    return locals?.privacy?.profileId ?? fallback;
  };

  router.get('/', async (req, res) => {
    const fallback = typeof req.query.profileId === 'string' ? req.query.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }

    const records = await deps.drivesRepo.findActiveByProfile(profileId);
    return res.status(200).json({ drives: records.map(toSummary) });
  });

  router.get('/:driveId/resume', async (req, res) => {
    const fallback = typeof req.query.profileId === 'string' ? req.query.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }

    const { driveId } = req.params;
    const record = await deps.drivesRepo.findById(driveId);
    if (!record) {
      return res.status(404).json({ code: 'DRIVE_NOT_FOUND', message: 'Drive not found' });
    }

    const preferences = await deps.preferencesService.getPreferences(profileId);

    return res.status(200).json({
      ...toSummary(record),
      preferences: preferences ?? null,
    });
  });

  router.get('/:driveId', async (req, res) => {
    const fallback = typeof req.query.profileId === 'string' ? req.query.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }
    const { driveId } = req.params;
    const record = await deps.drivesRepo.findById(driveId);
    if (!record) {
      return res.status(404).json({ code: 'DRIVE_NOT_FOUND', message: 'Drive not found' });
    }
    return res.status(200).json(toSummary(record));
  });

  router.post('/', async (req, res) => {
    const payload = validate(createTripSchema, {
      profileId: req.body?.profileId,
      origin: req.body?.origin,
      destination: req.body?.destination,
      departureTime: req.body?.departureTime,
      interestTags: interestArray(req.body?.interestTags ?? req.body?.interests),
      consentVersion: req.body?.consentVersion,
    });

    const fallbackProfile = typeof payload.profileId === 'string' ? payload.profileId : undefined;
    const profileId = resolveProfileId(res, fallbackProfile);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }

    const activeTrips = await deps.drivesRepo.findActiveByProfile(profileId);
    const existingDraft = activeTrips.find(
      (drive) =>
        drive.origin_raw === payload.origin &&
        drive.destination_raw === payload.destination &&
        ['draft', 'planned'].includes(drive.status),
    );

    if (existingDraft) {
      return res.status(409).json({
        code: 'TRIP_ALREADY_PENDING',
        message: 'Existing pending drive found for this origin and destination.',
      });
    }

    const now = new Date().toISOString();
    const driveId = crypto.randomUUID();

    const created = await deps.drivesRepo.create({
      driveId,
      profileId,
      originRaw: payload.origin,
      originHash: crypto.createHash('sha1').update(payload.origin).digest('hex'),
      destinationRaw: payload.destination,
      destinationHash: crypto.createHash('sha1').update(payload.destination).digest('hex'),
      departureTime: payload.departureTime ?? now,
      interestTags: payload.interestTags,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json(toSummary(created));
  });

  router.delete('/:driveId', async (req, res) => {
    const { driveId } = req.params;
    const record = await deps.drivesRepo.findById(driveId);
    if (!record) {
      return res.status(404).json({ code: 'DRIVE_NOT_FOUND', message: 'Drive not found' });
    }

    await deps.deletionService.queueTripDeletion(driveId, 'user');

    return res.status(204).send();
  });

  router.delete('/', async (req, res) => {
    const fallback = typeof req.body?.profileId === 'string' ? req.body.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }

    const result = await deps.deletionService.queueBulkTripDeletion(profileId);

    return res.status(202).json({
      requestId: result.requestId,
      status: 'pending',
      message: 'Trip history deletion queued.',
      driveCount: result.count,
    });
  });

  return router;
};
