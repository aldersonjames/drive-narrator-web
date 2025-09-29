import express from 'express';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';

import { createRoutesController } from './routes/routesController';
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
import { RouteScoringService } from '../services/scoring/routeScoringService';
import { NarrationScheduler } from '../services/narration/narrationScheduler';
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
const routeScoring = new RouteScoringService();
const narrationScheduler = new NarrationScheduler();
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

const container = {
  travelerProfilesRepo,
  tripsRepo,
  routeOptionsRepo,
  poiRepo,
  narrationSessionsRepo,
  narrationScheduler,
  preferencesService,
};
void container;

app.post(
  '/api/routes',
  createRoutesController({
    orsClient,
    poiClient,
    poiFilter,
    scoring: routeScoring,
  }),
);

app.use((err: Error, _req: Request, res: Response) => {
  res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message });
});

export default app;
