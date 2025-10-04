import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const REDACTED_KEYS = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key']);

interface LogFields {
  [key: string]: unknown;
}

interface LogEntry extends LogFields {
  level: 'debug' | 'info' | 'warn' | 'error';
  msg: string;
  time: string;
}

const redactValue = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (value && typeof value === 'object') {
    return '[REDACTED]';
  }
  return value;
};

const sanitize = (fields: LogFields): LogFields => {
  const output: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (REDACTED_KEYS.has(key.toLowerCase())) {
      output[key] = redactValue(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = sanitize(value as LogFields);
    } else {
      output[key] = value;
    }
  }
  return output;
};

export class Logger {
  constructor(private readonly context: LogFields = {}) {}

  child(context: LogFields): Logger {
    return new Logger({ ...this.context, ...context });
  }

  debug(message: string, fields: LogFields = {}): void {
    this.write('debug', message, fields);
  }

  info(message: string, fields: LogFields = {}): void {
    this.write('info', message, fields);
  }

  warn(message: string, fields: LogFields = {}): void {
    this.write('warn', message, fields);
  }

  error(message: string, fields: LogFields = {}): void {
    this.write('error', message, fields);
  }

  private write(level: LogEntry['level'], message: string, fields: LogFields): void {
    const entry: LogEntry = {
      level,
      msg: message,
      time: new Date().toISOString(),
      ...sanitize({ ...this.context, ...fields }),
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
  }
}

export const logger = new Logger({ service: 'drive-narrator-api' });

export const requestLogger = (rootLogger: Logger) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = Date.now();
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();

    res.setHeader('x-request-id', requestId);

    const log = rootLogger.child({
      requestId,
      method: req.method,
      path: req.originalUrl,
    });

    log.info('Request received', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.on('finish', () => {
      log.info('Request completed', {
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  };
};
