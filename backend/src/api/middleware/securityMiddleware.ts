import type { Request, Response, NextFunction } from 'express';

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export interface SecurityMiddlewareOptions {
  rateLimit?: RateLimitOptions;
  allowedOrigins?: string[];
}

interface Bucket {
  count: number;
  expiresAt: number;
}

const DEFAULT_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60_000,
  max: 120,
};

const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173'];

export const createSecurityMiddleware = (options: SecurityMiddlewareOptions = {}) => {
  const rateLimitOptions = options.rateLimit ?? DEFAULT_RATE_LIMIT;
  const allowedOrigins = options.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS;
  const buckets = new Map<string, Bucket>();

  const applyCors = (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Vary', 'Origin');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Traveler-Id',
    );
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      res.status(204).send();
      return;
    }

    next();
  };

  const applyRateLimiting = (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip ?? 'unknown'}:${req.method}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.expiresAt <= now) {
      buckets.set(key, { count: 1, expiresAt: now + rateLimitOptions.windowMs });
      res.setHeader('X-RateLimit-Limit', String(rateLimitOptions.max));
      res.setHeader('X-RateLimit-Remaining', String(rateLimitOptions.max - 1));
      next();
      return;
    }

    bucket.count += 1;

    if (bucket.count > rateLimitOptions.max) {
      const retryAfter = Math.ceil((bucket.expiresAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.setHeader('X-RateLimit-Limit', String(rateLimitOptions.max));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Slow down and try again shortly.',
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', String(rateLimitOptions.max));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(Math.max(rateLimitOptions.max - bucket.count, 0)),
    );
    next();
  };

  return {
    cors: applyCors,
    rateLimiter: applyRateLimiting,
  };
};
