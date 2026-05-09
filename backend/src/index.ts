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
import { errorHandler } from './middleware/errorHandler';
import { authLimiter, logIngestionLimiter } from './middleware/rateLimiter';

// Load environment variables from .env.
dotenv.config();

export const app = express();

// 1. Security headers.
app.use(helmet());

// 2. CORS.
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  }),
);

// 3. Response compression.
app.use(compression());

// 4. Body parsing with a 1 MB cap to prevent oversized payloads.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 5. HTTP request logging.
app.use(morgan('dev'));

// Routes.
app.use('/auth', authLimiter, authRouter);
app.use('/api/v1/log', logIngestionLimiter, logsRouter);
app.use('/api/v1/stats', statsRouter);
app.use('/api/v1/budgets', budgetsRouter);

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

const port = Number(process.env.PORT) || 3001;
export const server =
  process.env.NODE_ENV === 'test'
    ? null
    : app.listen(port, () => {
        logger.info(`Server running on port ${port}`);
      });
