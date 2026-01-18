import express, { type ErrorRequestHandler } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { prisma } from './config/database';
import { logger } from './utils/logger';

// Load environment variables from .env.
dotenv.config();

const app = express();

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

// Global error handler.
const errorHandler: ErrorRequestHandler = (err, _req, res) => {
  logger.error('Unhandled error', err as Error);
  res.status(500).json({ status: 'error', message: 'Internal server error' });
};
app.use(errorHandler);

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

