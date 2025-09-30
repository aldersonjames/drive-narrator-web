import { describe, expect, it, beforeEach } from '@jest/globals';

import {
  InMemoryTravelerProfilesRepository,
  InMemoryTripsRepository,
  InMemoryRouteOptionsRepository,
  InMemoryPointsOfInterestRepository,
  InMemoryNarrationSessionsRepository,
  InMemoryDeletionAuditRepository,
} from '../../../src/api/store/memoryRepositories';
import { DeletionService } from '../../../src/services/privacy/deletionService';
import { Logger } from '../../../src/utils/logger';

const createTraveler = async (repo: InMemoryTravelerProfilesRepository) => {
  await repo.create({
    profileId: 'traveler-001',
    displayName: 'Traveler',
    interestTags: ['historic'],
    assistantVoiceId: 'assistant-default',
    narrationVoiceId: 'narrator-default',
    transcriptOptIn: true,
    consentVersion: '1.0.0',
    consentAcceptedAt: new Date().toISOString(),
  });
};

const createTripBundle = async (
  tripsRepo: InMemoryTripsRepository,
  routeOptionsRepo: InMemoryRouteOptionsRepository,
  poiRepo: InMemoryPointsOfInterestRepository,
) => {
  await tripsRepo.create({
    tripId: 'trip-001',
    profileId: 'traveler-001',
    originRaw: 'Austin, TX',
    originHash: 'austin',
    destinationRaw: 'Santa Fe, NM',
    destinationHash: 'santafe',
    departureTime: new Date().toISOString(),
    interestTags: ['historic'],
    status: 'planned',
  });

  await routeOptionsRepo.insertMany([
    {
      routeId: 'route-001',
      tripId: 'trip-001',
      source: 'ors',
      polyline: '[]',
      durationMinutes: 120,
      distanceKm: 200,
      score: 0.8,
      scoreBreakdown: { poi: 0.5 },
      warnings: [],
    },
  ]);

  await poiRepo.insertMany([
    {
      poiId: 'poi-001',
      routeId: 'route-001',
      provider: 'mock-data',
      category: 'historic',
      relevance: 0.9,
      coordinatesLat: 30.26,
      coordinatesLng: -97.74,
      summary: 'Historic stop',
      narrationScript: 'Narration',
      narrationPreview: 'Preview',
      etaOffsetSeconds: 0,
      attribution: {},
    },
  ]);
};

describe('DeletionService', () => {
  let travelerRepo: InMemoryTravelerProfilesRepository;
  let tripsRepo: InMemoryTripsRepository;
  let routeOptionsRepo: InMemoryRouteOptionsRepository;
  let poiRepo: InMemoryPointsOfInterestRepository;
  let narrationRepo: InMemoryNarrationSessionsRepository;
  let auditRepo: InMemoryDeletionAuditRepository;
  let deletionService: DeletionService;

  beforeEach(async () => {
    travelerRepo = new InMemoryTravelerProfilesRepository();
    tripsRepo = new InMemoryTripsRepository();
    routeOptionsRepo = new InMemoryRouteOptionsRepository();
    poiRepo = new InMemoryPointsOfInterestRepository();
    narrationRepo = new InMemoryNarrationSessionsRepository();
    auditRepo = new InMemoryDeletionAuditRepository();

    const logger = new Logger({ service: 'test' });

    deletionService = new DeletionService({
      profilesRepo: travelerRepo,
      tripsRepo,
      routeOptionsRepo,
      poiRepo,
      narrationRepo,
      auditRepo,
      logger,
    });

    await createTraveler(travelerRepo);
    await createTripBundle(tripsRepo, routeOptionsRepo, poiRepo);
  });

  it('enqueues profile deletion and marks trips for removal', async () => {
    const result = await deletionService.enqueueProfileDeletion('traveler-001');

    expect(result.tripCount).toBe(1);

    const profileLookup = await travelerRepo.findById('traveler-001');
    expect(profileLookup).toBeUndefined();

    const tripOptions = await routeOptionsRepo.findByTripId('trip-001');
    expect(tripOptions).toHaveLength(0);

    const auditEntries = await auditRepo.all();
    expect(auditEntries.length).toBeGreaterThanOrEqual(2);
    expect(auditEntries[0]?.profile_id).toBe('traveler-001');
  });

  it('queues individual trip deletion', async () => {
    await deletionService.queueTripDeletion('trip-001');

    const tripOptions = await routeOptionsRepo.findByTripId('trip-001');
    expect(tripOptions).toHaveLength(0);

    const auditEntries = await auditRepo.all();
    expect(auditEntries[0]?.scope).toContain('trip');
  });
});
