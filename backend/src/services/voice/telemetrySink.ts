import { logger } from '../../utils/logger';
import type { VoiceTelemetryEvent, VoiceTelemetrySink } from '../../types/voice';

export class LoggerVoiceTelemetrySink implements VoiceTelemetrySink {
  record(event: VoiceTelemetryEvent): void {
    logger.info('voice-telemetry', { event });
  }
}
