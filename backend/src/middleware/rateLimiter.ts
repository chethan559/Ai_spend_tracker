import rateLimit from 'express-rate-limit';
import { Request } from 'express';

const isDev = process.env.NODE_ENV === 'development';

// Keyed by API key header, fallback to IP
const apiKeyGenerator = (req: Request): string =>
  (req.headers['x-api-key'] as string) ||
  req.ip ||
  'unknown';

// For SDK log ingestion (single events)
export const logIngestionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 10000 : 1000,
  keyGenerator: apiKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many log requests. Max 1000/hour per API key.',
  },
});

// Stricter for batch — each batch = up to 100 events
export const batchLogLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 1000 : 100,
  keyGenerator: apiKeyGenerator,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many batch requests. Max 100/hour per API key.',
  },
});

// For auth routes — prevent brute force
// Keyed by IP (not API key — user doesn't have one yet)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many auth attempts. Try again in 15 minutes.',
  },
});

// For stats/dashboard endpoints
export const statsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Max 300/minute.',
  },
});

// For project endpoints
export const projectsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Max 100/minute.',
  },
});

// For budget endpoints
export const budgetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Max 100/minute.',
  },
});

// For API key regeneration — strict to prevent key-cycling abuse
export const keyRegenerationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isDev ? 100 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many key regeneration attempts. Max 3/hour.',
  },
});
