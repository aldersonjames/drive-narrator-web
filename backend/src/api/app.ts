import crypto from 'node:crypto';

import express from 'express';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';

import { createRoutesController } from './routes/routesController';
import { createCategoriesController } from './routes/categoriesController';
import { createPoisController } from './routes/poisController';
import { createTripsRouter } from './routes/tripsController';
import { createPreferencesController } from './routes/preferencesController';
import { createVoicesController } from './routes/voicesController';
import { createPrivacyMiddleware } from './middleware/privacyMiddleware';
import { createNarrationsController } from './routes/narrationsController';
import { createConversationController } from './routes/conversationController';
import {
  InMemoryTravelerProfilesRepository,
  InMemoryTripsRepository,
  InMemoryRouteOptionsRepository,
  InMemoryPointsOfInterestRepository,
  InMemoryNarrationSessionsRepository,
} from './store/memoryRepositories';
import { OpenRouteServiceClient } from '../services/routing/openRouteServiceClient';
import { PoiProviderClient } from '../services/poi/poiProviderClient';
import { PoiFilteringService } from '../services/poi/poiFilteringService';
import { CategoryCatalogService } from '../services/poi/categoryCatalogService';
import { RouteScoringService } from '../services/scoring/routeScoringService';
import { PreferencesService } from '../services/preferences/preferencesService';
import { ConversationService } from '../services/voice/conversationService';

const app = express();
app.use(bodyParser.json());

const travelerProfilesRepo = new InMemoryTravelerProfilesRepository();
const tripsRepo = new InMemoryTripsRepository();
const routeOptionsRepo = new InMemoryRouteOptionsRepository();
const poiRepo = new InMemoryPointsOfInterestRepository();
const narrationSessionsRepo = new InMemoryNarrationSessionsRepository();

const orsClient = new OpenRouteServiceClient();
const poiClient = new PoiProviderClient();
const poiFilter = new PoiFilteringService();
const categoryCatalog = new CategoryCatalogService(poiClient);
const routeScoring = new RouteScoringService();
const preferencesService = new PreferencesService(travelerProfilesRepo);
const conversationService = new ConversationService();

void travelerProfilesRepo.create({
  profileId: 'traveler-001',
  displayName: 'Sample Traveler',
  interestTags: ['historical', 'scenic'],
  assistantVoiceId: 'assistant-default',
  narrationVoiceId: 'narrator-default',
  transcriptOptIn: true,
  consentVersion: '1.0.0',
  consentAcceptedAt: new Date().toISOString(),
});

void travelerProfilesRepo.create({
  profileId: 'traveler-voice',
  displayName: 'Voice Persona Traveler',
  interestTags: ['historical'],
  assistantVoiceId: 'assistant-default',
  narrationVoiceId: 'narrator-default',
  transcriptOptIn: false,
  consentVersion: '1.0.0',
  consentAcceptedAt: new Date().toISOString(),
});

void tripsRepo.create({
  tripId: 'trip-abc',
  profileId: 'traveler-001',
  originRaw: 'Raleigh, NC',
  originHash: crypto.createHash('sha1').update('Raleigh, NC').digest('hex'),
  destinationRaw: 'Asheville, NC',
  destinationHash: crypto.createHash('sha1').update('Asheville, NC').digest('hex'),
  departureTime: new Date(Date.now() + 3600_000).toISOString(),
  interestTags: ['historical'],
  status: 'planned',
});

const privacyMiddleware = createPrivacyMiddleware({
  travelerProfilesRepo,
  minimumConsentVersion: '1.0.0',
});

const preferencesController = createPreferencesController({ preferencesService });

app.post(
  '/api/routes',
  createRoutesController({
    orsClient,
    poiClient,
    poiFilter,
    scoring: routeScoring,
  }),
);

app.get(
  '/api/poi/categories',
  createCategoriesController({
    catalogService: categoryCatalog,
    poiProvider: poiClient,
  }),
);

app.get(
  '/api/pois',
  createPoisController({
    poiClient,
    poiFilter,
  }),
);

app.use(
  '/api/trips',
  privacyMiddleware,
  createTripsRouter({
    tripsRepo,
    routeOptionsRepo,
    poiRepo,
    narrationRepo: narrationSessionsRepo,
    preferencesService,
  }),
);

app.get('/api/preferences', privacyMiddleware, preferencesController.get);
app.patch('/api/preferences', privacyMiddleware, preferencesController.patch);

app.get('/api/voices', createVoicesController());

app.post('/api/narrations', privacyMiddleware, createNarrationsController({ preferencesService }));

app.post(
  '/api/conversation',
  privacyMiddleware,
  createConversationController({ conversationService }),
);

app.use((err: Error, _req: Request, res: Response) => {
  res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message });
});

export default app;
