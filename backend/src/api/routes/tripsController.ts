import { Router, Response } from 'express';
import crypto from 'node:crypto';

import type { TripsRepository } from '../../db/repositories/tripsRepository';
import type { RouteOptionsRepository } from '../../db/repositories/routeOptionsRepository';
import type { PointsOfInterestRepository } from '../../db/repositories/pointsOfInterestRepository';
import type { NarrationSessionsRepository } from '../../db/repositories/narrationSessionsRepository';
import type { PreferencesService } from '../../services/preferences/preferencesService';

interface Dependencies {
  tripsRepo: Pick<TripsRepository, 'create' | 'findActiveByProfile' | 'findById' | 'update'>;
  routeOptionsRepo: Pick<RouteOptionsRepository, 'findByTripId' | 'deleteByTripId'>;
  poiRepo: Pick<PointsOfInterestRepository, 'deleteByRouteId'>;
  narrationRepo: Pick<NarrationSessionsRepository, 'deleteByTripId'>;
  preferencesService: PreferencesService;
}

const toSummary = (record: {
  trip_id: string;
  profile_id: string;
  origin_raw: string;
  destination_raw: string;
  departure_time: string;
  interest_tags: string;
  status: string;
  created_at: string;
  updated_at: string;
}) => ({
  tripId: record.trip_id,
  profileId: record.profile_id,
  origin: record.origin_raw,
  destination: record.destination_raw,
  departureTime: record.departure_time,
  interestTags: JSON.parse(record.interest_tags ?? '[]'),
  status: record.status,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
});

export const createTripsRouter = (deps: Dependencies): Router => {
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

    const records = await deps.tripsRepo.findActiveByProfile(profileId);
    return res.status(200).json({ trips: records.map(toSummary) });
  });

  router.get('/:tripId/resume', async (req, res) => {
    const fallback = typeof req.query.profileId === 'string' ? req.query.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }

    const { tripId } = req.params;
    const record = await deps.tripsRepo.findById(tripId);
    if (!record) {
      return res.status(404).json({ code: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    const preferences = await deps.preferencesService.getPreferences(profileId);

    return res.status(200).json({
      ...toSummary(record),
      preferences: preferences ?? null,
    });
  });

  router.get('/:tripId', async (req, res) => {
    const fallback = typeof req.query.profileId === 'string' ? req.query.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }
    const { tripId } = req.params;
    const record = await deps.tripsRepo.findById(tripId);
    if (!record) {
      return res.status(404).json({ code: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }
    return res.status(200).json(toSummary(record));
  });

  router.post('/', async (req, res) => {
    const fallbackProfile =
      typeof req.body?.profileId === 'string' ? req.body.profileId : undefined;
    const profileId = resolveProfileId(res, fallbackProfile);
    const { origin, destination, departureTime, consentVersion } = req.body ?? {};
    const interestCandidates = Array.isArray(req.body?.interestTags)
      ? req.body?.interestTags
      : Array.isArray(req.body?.interests)
        ? req.body?.interests
        : typeof req.body?.interests === 'string'
          ? req.body.interests
              .split(',')
              .map((token: string) => token.trim())
              .filter(Boolean)
          : [];

    if (!profileId || !origin || !destination || !interestCandidates.length) {
      return res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'profileId, origin, destination, interestTags are required',
      });
    }

    if (!consentVersion || typeof consentVersion !== 'string') {
      return res
        .status(400)
        .json({ code: 'CONSENT_REQUIRED', message: 'Traveler consent version is required.' });
    }

    const activeTrips = await deps.tripsRepo.findActiveByProfile(profileId);
    const existingDraft = activeTrips.find(
      (trip) =>
        trip.origin_raw === origin &&
        trip.destination_raw === destination &&
        ['draft', 'planned'].includes(trip.status),
    );

    if (existingDraft) {
      return res.status(409).json({
        code: 'TRIP_ALREADY_PENDING',
        message: 'Existing pending trip found for this origin and destination.',
      });
    }

    const now = new Date().toISOString();
    const tripId = crypto.randomUUID();

    const created = await deps.tripsRepo.create({
      tripId,
      profileId,
      originRaw: origin,
      originHash: crypto.createHash('sha1').update(origin).digest('hex'),
      destinationRaw: destination,
      destinationHash: crypto.createHash('sha1').update(destination).digest('hex'),
      departureTime: departureTime ?? now,
      interestTags: interestCandidates,
      status: 'planned',
      createdAt: now,
      updatedAt: now,
    });

    return res.status(201).json(toSummary(created));
  });

  router.delete('/:tripId', async (req, res) => {
    const { tripId } = req.params;
    const record = await deps.tripsRepo.findById(tripId);
    if (!record) {
      return res.status(404).json({ code: 'TRIP_NOT_FOUND', message: 'Trip not found' });
    }

    await deps.tripsRepo.update(tripId, {
      status: 'pending_deletion',
      updatedAt: new Date().toISOString(),
      lastAccessedAt: null,
    });

    const routeOptions = await deps.routeOptionsRepo.findByTripId(tripId);
    for (const option of routeOptions) {
      await deps.poiRepo.deleteByRouteId(option.route_id);
    }
    await deps.routeOptionsRepo.deleteByTripId(tripId);
    await deps.narrationRepo.deleteByTripId(tripId);

    return res.status(204).send();
  });

  router.delete('/', async (req, res) => {
    const fallback = typeof req.body?.profileId === 'string' ? req.body.profileId : undefined;
    const profileId = resolveProfileId(res, fallback);
    if (!profileId) {
      return res.status(400).json({ code: 'INVALID_REQUEST', message: 'profileId is required' });
    }

    const activeTrips = await deps.tripsRepo.findActiveByProfile(profileId);
    const updatedAt = new Date().toISOString();
    await Promise.all(
      activeTrips.map((trip) =>
        deps.tripsRepo.update(trip.trip_id, {
          status: 'pending_deletion',
          updatedAt,
        }),
      ),
    );

    return res.status(202).json({
      requestId: `del-${Date.now()}`,
      status: 'pending',
      message: 'Trip history deletion queued.',
    });
  });

  return router;
};
