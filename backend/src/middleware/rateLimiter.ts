import rateLimit from 'express-rate-limit';
import type { Request, RequestHandler } from 'express';

const getUserKey = (req: Request): string =>
  (req as { user?: { id?: string; apiKey?: string } }).user?.id ||
  req.ip ||
  'unknown';

const getApiKey = (req: Request): string =>
  (req as { user?: { apiKey?: string } }).user?.apiKey ||
  req.ip ||
  'unknown';

const isRateLimited = process.env.NODE_ENV === 'production';

const createLimiter = (handler: RequestHandler): RequestHandler =>
  isRateLimited ? handler : (_req, _res, next) => next();

/**
 * Rate limiter for log ingestion endpoints (per API key).
 */
export const logRateLimiter = createLimiter(
  rateLimit({
    windowMs: 60_000,
    max: 1000,
    message: 'Too many log requests, please try again later',
    keyGenerator: getApiKey,
  }),
);

/**
 * Rate limiter for API stats endpoints (per user).
 */
export const apiRateLimiter = createLimiter(
  rateLimit({
    windowMs: 60_000,
    max: 100,
    message: 'Too many API requests, please try again later',
    keyGenerator: getUserKey,
  }),
);

/**
 * Rate limiter for authentication endpoints (per IP).
 */
export const authRateLimiter = createLimiter(
  rateLimit({
    windowMs: 15 * 60_000,
    max: 5,
    message: 'Too many authentication attempts',
  }),
);

