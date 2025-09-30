import crypto from 'node:crypto';

import type { TravelerProfilesRepository } from '../../db/repositories/travelerProfilesRepository';
import type { TripsRepository, TripRecord } from '../../db/repositories/tripsRepository';
import type { RouteOptionsRepository } from '../../db/repositories/routeOptionsRepository';
import type { PointsOfInterestRepository } from '../../db/repositories/pointsOfInterestRepository';
import type { NarrationSessionsRepository } from '../../db/repositories/narrationSessionsRepository';
import type { Logger } from '../../utils/logger';

interface AuditRepository {
  record(entry: {
    auditId: string;
    profileId: string;
    scope: string;
    createdAt: string;
    metadata?: Record<string, unknown> | null;
  }): Promise<void>;
}

interface Dependencies {
  profilesRepo: Pick<TravelerProfilesRepository, 'softDelete' | 'findById'>;
  tripsRepo: Pick<TripsRepository, 'findActiveByProfile' | 'findById' | 'update'>;
  routeOptionsRepo: Pick<RouteOptionsRepository, 'findByTripId' | 'deleteByTripId'>;
  poiRepo: Pick<PointsOfInterestRepository, 'deleteByRouteId'>;
  narrationRepo: Pick<NarrationSessionsRepository, 'deleteByTripId'>;
  auditRepo: AuditRepository;
  logger: Logger;
}

export class DeletionService {
  constructor(private readonly deps: Dependencies) {}

  async enqueueProfileDeletion(
    profileId: string,
  ): Promise<{ requestId: string; tripCount: number }> {
    const now = new Date().toISOString();
    const requestId = crypto.randomUUID();

    await this.deps.profilesRepo.softDelete(profileId, requestId, now);
    const trips = await this.deps.tripsRepo.findActiveByProfile(profileId);

    for (const trip of trips) {
      await this.queueTripDeletionInternal(trip, 'profile');
    }

    await this.deps.auditRepo.record({
      auditId: requestId,
      profileId,
      scope: 'profile',
      createdAt: now,
      metadata: { tripCount: trips.length },
    });

    this.deps.logger.info('Profile deletion enqueued', {
      profileId,
      requestId,
      tripCount: trips.length,
    });

    return { requestId, tripCount: trips.length };
  }

  async queueTripDeletion(
    tripId: string,
    source: 'user' | 'profile' | 'bulk' = 'user',
  ): Promise<void> {
    const trip = await this.deps.tripsRepo.findById(tripId);
    if (!trip) {
      return;
    }

    await this.queueTripDeletionInternal(trip, source);
  }

  async queueBulkTripDeletion(profileId: string): Promise<{ requestId: string; count: number }> {
    const trips = await this.deps.tripsRepo.findActiveByProfile(profileId);
    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    for (const trip of trips) {
      await this.queueTripDeletionInternal(trip, 'bulk');
    }

    await this.deps.auditRepo.record({
      auditId: requestId,
      profileId,
      scope: 'trip-bulk',
      createdAt: now,
      metadata: { tripCount: trips.length },
    });

    this.deps.logger.info('Bulk trip deletion enqueued', {
      profileId,
      requestId,
      tripCount: trips.length,
    });

    return { requestId, count: trips.length };
  }

  private async queueTripDeletionInternal(trip: TripRecord, scope: string): Promise<void> {
    const now = new Date().toISOString();

    await this.deps.tripsRepo.update(trip.trip_id, {
      status: 'pending_deletion',
      updatedAt: now,
      lastAccessedAt: null,
    });

    const routeOptions = await this.deps.routeOptionsRepo.findByTripId(trip.trip_id);
    for (const option of routeOptions) {
      await this.deps.poiRepo.deleteByRouteId(option.route_id);
    }
    await this.deps.routeOptionsRepo.deleteByTripId(trip.trip_id);
    await this.deps.narrationRepo.deleteByTripId(trip.trip_id);

    await this.deps.auditRepo.record({
      auditId: crypto.randomUUID(),
      profileId: trip.profile_id,
      scope: `trip:${scope}`,
      createdAt: now,
      metadata: {
        tripId: trip.trip_id,
        origin: trip.origin_raw,
        destination: trip.destination_raw,
      },
    });

    this.deps.logger.info('Trip deletion queued', {
      profileId: trip.profile_id,
      tripId: trip.trip_id,
      scope,
    });
  }
}
