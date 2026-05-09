import rateLimit from 'express-rate-limit';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

const isRateLimited = process.env.NODE_ENV === 'production';

const createLimiter = (handler: RequestHandler): RequestHandler =>
  isRateLimited ? handler : (_req, _res, next) => next();

const rateLimitResponse = (
  req: Request,
  res: Response,
  _next: NextFunction,
  windowMs: number,
): void => {
  const resetTime = (req as { rateLimit?: { resetTime?: Date } }).rateLimit
    ?.resetTime;
  const retryAfter = resetTime
    ? Math.ceil((resetTime.getTime() - Date.now()) / 1000)
    : Math.ceil(windowMs / 1000);
  res.status(429).json({ error: 'Rate limit exceeded', retryAfter });
};

/**
 * Rate limiter for log ingestion endpoints.
 * 1000 requests per hour, keyed on X-API-Key header, then Bearer token, then IP.
 */
const LOG_WINDOW_MS = 60 * 60_000; // 1 hour

export const logRateLimiter = createLimiter(
  rateLimit({
    windowMs: LOG_WINDOW_MS,
    max: 1000,
    keyGenerator: (req: Request): string => {
      const xApiKey = req.headers['x-api-key'];
      if (xApiKey) return Array.isArray(xApiKey) ? xApiKey[0] : xApiKey;
      const auth = req.headers.authorization ?? '';
      if (auth.startsWith('Bearer ')) return auth.slice(7);
      return req.ip ?? 'unknown';
    },
    handler: (req, res, next) => rateLimitResponse(req, res, next, LOG_WINDOW_MS),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/**
 * Rate limiter for API stats endpoints (per user ID, fallback to IP).
 */
const API_WINDOW_MS = 60_000; // 1 minute

export const apiRateLimiter = createLimiter(
  rateLimit({
    windowMs: API_WINDOW_MS,
    max: 100,
    keyGenerator: (req: Request): string =>
      (req as { user?: { id?: string } }).user?.id ?? req.ip ?? 'unknown',
    handler: (req, res, next) => rateLimitResponse(req, res, next, API_WINDOW_MS),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

/**
 * Rate limiter for authentication endpoints — 100 requests per minute per IP.
 */
const AUTH_WINDOW_MS = 60_000; // 1 minute

export const authRateLimiter = createLimiter(
  rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max: 100,
    handler: (req, res, next) => rateLimitResponse(req, res, next, AUTH_WINDOW_MS),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ---------------------------------------------------------------------------
// App-level limiters (active in all envs except NODE_ENV === 'test')
// ---------------------------------------------------------------------------

/**
 * SDK single-log ingestion: 1000 requests per hour per API key.
 */
export const logIngestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  keyGenerator: (req: Request): string =>
    (req.headers['x-api-key'] as string) || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Rate limit exceeded. Max 1000 log requests per hour.',
    retryAfter: 'See Retry-After header',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * SDK batch ingestion: 100 batches per hour per API key (= up to 10,000 events/hr).
 */
export const batchLogLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  keyGenerator: (req: Request): string =>
    (req.headers['x-api-key'] as string) || req.ip || 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Batch rate limit exceeded. Max 100 batch requests per hour.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Auth routes: 20 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many auth attempts. Try again in 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});
