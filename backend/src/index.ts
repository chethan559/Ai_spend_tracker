import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import { prisma } from './config/database';
import { logger } from './utils/logger';
import { authRouter } from './routes/auth.routes';
import { logsRouter } from './routes/logs.routes';
import { statsRouter } from './routes/stats.routes';
import { budgetsRouter } from './routes/budgets.routes';
import { projectsRouter } from './routes/projects.routes';
import { errorHandler } from './middleware/errorHandler';
import {
  logIngestionLimiter,
  batchLogLimiter,
  authLimiter,
  statsLimiter,
  budgetLimiter,
  projectsLimiter,
} from './middleware/rateLimiter';
import { startWeeklyDigestJob } from './jobs/weeklyDigest';

// Load environment variables from .env.
dotenv.config();

export const app = express();
app.set('trust proxy', 1);

/*
  MIDDLEWARE ORDER:
  1. helmet()
  2. cors() — dynamic origin whitelist, no wildcard fallback
  3. compression()
  4. express.json({ limit: '1mb' })
  5. express.urlencoded()
  6. morgan()
  7. /auth              → authLimiter → authRouter
  8. /api/v1/log/batch  → batchLogLimiter (applied first, before general log limiter)
  9. /api/v1/log        → logIngestionLimiter → logsRouter
  10. /api/v1/stats     → statsLimiter → statsRouter
  11. /api/v1/budgets   → budgetLimiter → budgetsRouter
  12. /api/v1/projects  → projectsLimiter → projectsRouter
  13. 404 handler
  13. errorHandler
*/

// 1. Security headers.
app.use(helmet());

// 2. CORS — explicit origin whitelist; never falls back to *.
const getAllowedOrigins = (): string[] => {
  const origins: string[] = [];

  // Always allow local development origins in dev/test.
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:3001');
    origins.push('http://127.0.0.1:3000');
  }

  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }

  if (process.env.EXTRA_ALLOWED_ORIGINS) {
    const extras = process.env.EXTRA_ALLOWED_ORIGINS
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    origins.push(...extras);
  }

  return origins;
};

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      const allowedOrigins = getAllowedOrigins();

      // Allow requests with no origin (mobile apps, curl, Postman, SDK server-side calls).
      if (!requestOrigin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(requestOrigin)) {
        return callback(null, true);
      }

      // In production — reject unknown origins.
      if (process.env.NODE_ENV === 'production') {
        logger.warn('CORS blocked request', { origin: requestOrigin, allowed: allowedOrigins });
        return callback(new Error(`CORS: origin ${requestOrigin} not allowed`), false);
      }

      // In development — allow but warn.
      logger.warn('CORS: allowing unknown origin in dev', { origin: requestOrigin });
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  }),
);

// 3. Response compression.
app.use(compression());

// 4. Body parsing with a 1 MB cap to prevent oversized payloads.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. HTTP request logging.
app.use(morgan('dev'));

// Routes — limiters applied once here, never inside route files.
app.use('/auth', authLimiter, authRouter);

// Batch limiter MUST come before the general log limiter — Express matches in order.
app.post('/api/v1/log/batch', batchLogLimiter);
app.use('/api/v1/log', logIngestionLimiter, logsRouter);

app.use('/api/v1/stats', statsLimiter, statsRouter);
app.use('/api/v1/budgets', budgetLimiter, budgetsRouter);
app.use('/api/v1/projects', projectsLimiter, projectsRouter);

// Manual email test — remove before shipping to production.
app.get('/test-email', async (_req, res) => {
  const { sendWelcomeEmail } = await import('./services/email.service');
  await sendWelcomeEmail({
    userEmail: process.env.TEST_EMAIL ?? 'you@example.com',
    apiKey: 'ast_test123',
    dashboardUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard`,
  });
  res.json({ sent: true });
});

// Health check routes.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    logger.error('Database health check failed', error as Error);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// 404 handler for unknown routes.
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Startup validation — run before app.listen, skipped in test.
// ---------------------------------------------------------------------------

function validateEnv(): void {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const recommended = ['FRONTEND_URL', 'RESEND_API_KEY'];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    logger.error('Missing required env vars — server cannot start', { missing });
    process.exit(1);
  }

  const missingRecommended = recommended.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    logger.warn('Missing recommended env vars', { missing: missingRecommended });
  }

  if (
    process.env.JWT_SECRET === 'dev-secret-change-in-production' &&
    process.env.NODE_ENV === 'production'
  ) {
    logger.error('Default JWT_SECRET in production — shutting down');
    process.exit(1);
  }

  if (!process.env.FRONTEND_URL && process.env.NODE_ENV === 'production') {
    logger.warn('FRONTEND_URL not set — CORS restricted to localhost only in prod');
  }
}

if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

// ---------------------------------------------------------------------------
// Server startup.
// ---------------------------------------------------------------------------

const port = Number(process.env.PORT) || 3001;
export const server =
  process.env.NODE_ENV === 'test'
    ? null
    : app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
        startWeeklyDigestJob();
        logger.info('Weekly digest cron job scheduled');
      });

// ---------------------------------------------------------------------------
// Graceful shutdown — close DB connections cleanly on SIGTERM/SIGINT.
// ---------------------------------------------------------------------------

const shutdown = async (signal: string) => {
  logger.info(`${signal} received — shutting down gracefully`);
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', error as Error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
