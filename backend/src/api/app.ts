import crypto from 'node:crypto';

import express from 'express';
import type { Request, Response } from 'express';
import bodyParser from 'body-parser';
// import OpenAI from 'openai';

import { createRoutesController } from './routes/routesController';
import { createCategoriesController } from './routes/categoriesController';
import { createPoisController } from './routes/poisController';
import { createDrivesRouter } from './routes/drivesController';
import { createPreferencesController } from './routes/preferencesController';
import { createVoicesController } from './routes/voicesController';
import { createVoicePreviewController } from './routes/voicePreviewController';
import { createPrivacyMiddleware } from './middleware/privacyMiddleware';
import { createNarrationsController } from './routes/narrationsController';
import { createConversationController } from './routes/conversationController';
import { createVoiceSessionController } from './routes/voiceSessionController';
import {
  InMemoryTravelerProfilesRepository,
  InMemoryDrivesRepository,
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
// import { ConversationService } from '../services/voice/conversationService';
import { ValidationError } from '../utils/validation';
import { logger, requestLogger } from '../utils/logger';
import { createOpenAIClient } from '../utils/openaiClient';
import { createSecurityMiddleware } from './middleware/securityMiddleware';
import { DeletionService } from '../services/privacy/deletionService';
import { InMemoryVoiceTokenStore } from '../services/voice/tokenStore';
import { VoicePipelineService } from '../services/voice/voicePipelineService';
import type { VoiceAdapterConfig, VoiceRateLimitConfig } from '../types/voice';
import type { VoiceProviderId } from '../../../shared/types/driveNarrator';

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
const drivesRepo = new InMemoryDrivesRepository();
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
// const conversationService = new ConversationService({ profilesRepo: travelerProfilesRepo });
const deletionService = new DeletionService({
  profilesRepo: travelerProfilesRepo,
  drivesRepo,
  routeOptionsRepo,
  poiRepo,
  narrationRepo: narrationSessionsRepo,
  auditRepo: deletionAuditRepo,
  logger,
});

// Initialize OpenAI for voice preview
// Create OpenAI client with proper validation
const openai = createOpenAIClient();

void travelerProfilesRepo.create({
  profileId: 'traveler-001',
  displayName: 'Sample Traveler',
  interestTags: ['historical', 'scenic'],
  assistantVoiceId: 'nova',
  narrationVoiceId: 'nova',
  transcriptOptIn: true,
  consentVersion: '1.0.0',
  consentAcceptedAt: new Date().toISOString(),
  metadata: {
    narrationPersonaId: 'aurora-companion',
    poiProvider: 'ops',
  },
});

void travelerProfilesRepo.create({
  profileId: 'traveler-voice',
  displayName: 'Voice Persona Traveler',
  interestTags: ['historical'],
  assistantVoiceId: 'nova',
  narrationVoiceId: 'nova',
  transcriptOptIn: false,
  consentVersion: '1.0.0',
  consentAcceptedAt: new Date().toISOString(),
  metadata: {
    narrationPersonaId: 'aurora-companion',
    poiProvider: 'ops',
  },
});

void drivesRepo.create({
  driveId: 'drive-abc',
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
        voice: process.env.VOICE_VOICE_OPENAI ?? 'nova',
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
  logger.info('✅ Voice pipeline service initialized successfully');
} catch (error) {
  logger.error('❌ Voice pipeline service failed to initialize', { 
    error: (error as Error).message,
    stack: (error as Error).stack,
    adapterConfig: {
      region: voiceAdapterConfig.region,
      asrProvider: voiceAdapterConfig.asrProvider,
      ttsProvider: voiceAdapterConfig.ttsProvider,
      hasOpenAi: !!voiceAdapterConfig.openAi,
      hasElevenLabs: !!voiceAdapterConfig.elevenLabs
    }
  });
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
  '/api/drives',
  privacyMiddleware,
  createDrivesRouter({
    drivesRepo,
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

if (openai) {
  logger.info('✅ Voice preview enabled with validated API key');
  const voicePreviewController = createVoicePreviewController({ openai });
  app.post('/api/voices/preview', voicePreviewController.preview);
} else {
  logger.warn('⚠️ Voice preview disabled - OpenAI not properly configured');
}

app.post('/api/narrations', privacyMiddleware, createNarrationsController({ preferencesService }));

if (openai) {
  const conversationController = createConversationController({ openai });
  app.post('/api/conversation', privacyMiddleware, conversationController.processConversation);
} else {
  logger.warn('⚠️ Conversation disabled - OpenAI not properly configured');
}

if (voicePipelineService) {
  app.post(
    '/api/voice/session',
    createVoiceSessionController({ voiceService: voicePipelineService, logger }),
  );
  logger.info('✅ Voice session endpoint registered');
} else {
  logger.warn('⚠️ Voice session endpoint not registered - voice pipeline service unavailable');
  
  // Add a fallback endpoint to show status
  app.post('/api/voice/session', (req, res) => {
    res.status(503).json({
      code: 'VOICE_SERVICE_UNAVAILABLE',
      message: 'Voice service is not available. Check backend logs for details.',
      status: 'voice-pipeline-service-failed'
    });
  });
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
