import type { Request, Response } from 'express';

import type { VoicePipelineService } from '../../services/voice/voicePipelineService';
import type { VoiceTransport } from '../../types/voice';

interface Dependencies {
  voiceService: VoicePipelineService;
  logger: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

const VALID_TRANSPORTS: VoiceTransport[] = ['webrtc', 'websocket'];

const toTransport = (value: unknown): VoiceTransport => {
  if (typeof value === 'string' && VALID_TRANSPORTS.includes(value as VoiceTransport)) {
    return value as VoiceTransport;
  }
  return 'webrtc';
};

export const createVoiceSessionController = ({ voiceService, logger }: Dependencies) => {
  return async (req: Request, res: Response): Promise<Response> => {
    const deviceId = (req.headers['x-device-id'] ?? '') as string;
    if (!deviceId) {
      return res
        .status(400)
        .json({ code: 'DEVICE_ID_REQUIRED', message: 'x-device-id header is required.' });
    }

    const transport = toTransport(req.query.transport ?? req.body?.transport);

    // Extract voice preferences from request body
    const { voiceId, personaId } = req.body || {};

    try {
      const { session, pipeline } = await voiceService.createSession({
        deviceId,
        transport,
        voicePreferences: {
          voiceId,
          personaId,
        },
      });
      logger.info('voice-session-issued', {
        deviceId,
        transport,
        provider: session.provider,
        voiceId,
        personaId,
      });
      return res.status(201).json({
        ...session,
        voicePipeline: pipeline,
      });
    } catch (error) {
      const err = error as Error;
      if (err.message === 'VOICE_RATE_LIMIT_EXCEEDED') {
        logger.warn('voice-session-rate-limit', { deviceId });
        return res.status(429).json({
          code: 'VOICE_RATE_LIMIT_EXCEEDED',
          message: 'Device has requested too many voice sessions. Please wait and try again.',
        });
      }

      logger.warn('voice-session-error', { deviceId, error: err.message });
      return res
        .status(500)
        .json({ code: 'VOICE_SESSION_FAILED', message: 'Could not create voice session.' });
    }
  };
};
