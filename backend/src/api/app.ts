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
  }),
);

app.get('/api/preferences', privacyMiddleware, preferencesController.get);
app.patch('/api/preferences', privacyMiddleware, preferencesController.patch);

app.get('/api/voices', createVoicesController());

app.use((err: Error, _req: Request, res: Response) => {
  res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message });
});

export default app;
