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
import { createVoiceSessionController } from './routes/voiceSessionController';
import {
  InMemoryTravelerProfilesRepository,
  InMemoryTripsRepository,
  InMemoryRouteOptionsRepository,
  InMemoryPointsOfInterestRepository,
  InMemoryNarrationSessionsRepository,
  InMemoryDeletionAuditRepository,
} from './store/memoryRepositories';
import { OpenRouteServiceClient } from '../services/routing/openRouteServiceClient';
import { PoiProviderClient } from '../services/poi/poiProviderClient';
import { PoiFilteringService } from '../services/poi/poiFilteringService';
import { CategoryCatalogService } from '../services/poi/categoryCatalogService';
import { RouteScoringService } from '../services/scoring/routeScoringService';
import { PreferencesService } from '../services/preferences/preferencesService';
import { ConversationService } from '../services/voice/conversationService';
import { ValidationError } from '../utils/validation';
import { logger, requestLogger } from '../utils/logger';
import { createSecurityMiddleware } from './middleware/securityMiddleware';
import { DeletionService } from '../services/privacy/deletionService';
import { InMemoryVoiceTokenStore } from '../services/voice/tokenStore';
import { VoicePipelineService } from '../services/voice/voicePipelineService';
import type { VoiceAdapterConfig, VoiceRateLimitConfig } from '../types/voice';
import type { VoiceProviderId } from '../../../shared/types/tripNarrator';

const app = express();
app.use(bodyParser.json());
app.use(requestLogger(logger));

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const security = createSecurityMiddleware({
  allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()),
  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 120),
  },
});

app.use(security.cors);
app.use(security.rateLimiter);

const travelerProfilesRepo = new InMemoryTravelerProfilesRepository();
const tripsRepo = new InMemoryTripsRepository();
const routeOptionsRepo = new InMemoryRouteOptionsRepository();
const poiRepo = new InMemoryPointsOfInterestRepository();
const narrationSessionsRepo = new InMemoryNarrationSessionsRepository();
const deletionAuditRepo = new InMemoryDeletionAuditRepository();

const orsClient = new OpenRouteServiceClient();
const poiClient = new PoiProviderClient();
const poiFilter = new PoiFilteringService();
const categoryCatalog = new CategoryCatalogService(poiClient);
const routeScoring = new RouteScoringService();
const preferencesService = new PreferencesService(travelerProfilesRepo);
const conversationService = new ConversationService();
const deletionService = new DeletionService({
  profilesRepo: travelerProfilesRepo,
  tripsRepo,
  routeOptionsRepo,
  poiRepo,
  narrationRepo: narrationSessionsRepo,
  auditRepo: deletionAuditRepo,
  logger,
});

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
  travelerProfilesRepo: {
    findById: (profileId: string) => travelerProfilesRepo.findById(profileId),
  },
  minimumConsentVersion: '1.0.0',
});

const preferencesController = createPreferencesController({
  preferencesService,
  poiProvider: poiClient,
  deletionService,
});

const parseVoiceProvider = (
  value: string | undefined,
  fallback: VoiceProviderId,
): VoiceProviderId => {
  if (value === 'openai' || value === 'elevenlabs') {
    return value;
  }
  return fallback;
};

const sessionTtlSeconds = parseNumber(process.env.SESSION_TTL_SECONDS, 300);
const latencyTarget = parseNumber(process.env.VOICE_LATENCY_TARGET_MS, 350);
const latencyMax = parseNumber(process.env.VOICE_LATENCY_MAX_MS, 1200);
const maxInputMs = parseNumber(process.env.VOICE_CAP_MAX_INPUT_MS, 15000);

const voiceAdapterConfig: VoiceAdapterConfig = {
  region: process.env.VOICE_REGION ?? 'iad',
  asrProvider: parseVoiceProvider(process.env.VOICE_ASR_PROVIDER, 'openai'),
  ttsProvider: parseVoiceProvider(process.env.VOICE_TTS_PROVIDER, 'openai'),
  narrationProvider: parseVoiceProvider(process.env.VOICE_NARRATION_PROVIDER, 'openai'),
  openAi: process.env.OPENAI_API_KEY
    ? {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.VOICE_MODEL_OPENAI ?? 'gpt-4o-realtime-preview',
        voice: process.env.VOICE_VOICE_OPENAI ?? 'alloy',
      }
    : undefined,
  elevenLabs: process.env.ELEVENLABS_API_KEY
    ? {
        apiKey: process.env.ELEVENLABS_API_KEY,
      }
    : undefined,
  sessionTtlSeconds,
  latencyHints: {
    targetMs: latencyTarget,
    maxAcceptableMs: latencyMax,
  },
  caps: {
    maxInputMs,
    supportsBargeIn: true,
    supportsSSML: true,
  },
};

const voiceTokenStore = new InMemoryVoiceTokenStore();
let voicePipelineService: VoicePipelineService | undefined;

try {
  voicePipelineService = new VoicePipelineService({
    adapterConfig: voiceAdapterConfig,
    rateLimit: {
      maxPerDevice: parseNumber(process.env.RATE_LIMIT_PER_DEVICE, 8),
    } satisfies VoiceRateLimitConfig,
    tokenStore: voiceTokenStore,
  });
} catch (error) {
  logger.warn('voice-service-disabled', { error: (error as Error).message });
}

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
    deletionService,
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

if (voicePipelineService) {
  app.post(
    '/api/voice/session',
    createVoiceSessionController({ voiceService: voicePipelineService, logger }),
  );
}

app.use((err: Error, req: Request, res: Response) => {
  if (err instanceof ValidationError) {
    logger.warn('Validation error', {
      path: req.originalUrl,
      method: req.method,
      issues: err.issues,
    });
    return res.status(err.status).json({
      code: err.code,
      message: err.message,
      details: err.issues,
    });
  }

  logger.error('Unexpected error', {
    path: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: err.stack,
  });
  return res.status(500).json({ code: 'INTERNAL_ERROR', message: err.message });
});

export default app;
