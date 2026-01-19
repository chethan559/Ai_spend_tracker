import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { prisma } from './config/database';
import { logger } from './utils/logger';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middleware/errorHandler';
import { logsRouter } from './routes/logs.routes';
import { statsRouter } from './routes/stats.routes';

// Load environment variables from .env.
dotenv.config();

export const app = express();

// Security and parsing middleware.
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Auth routes.
app.use('/auth', authRouter);

// API log ingestion routes (used by SDK).
app.use('/api/v1/log', logsRouter);

// Analytics routes (used by dashboard).
app.use('/api/v1/stats', statsRouter);

// Health check route.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Database connectivity health check.
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

