import { Router } from 'express';

import {
  createBatchLogsHandler,
  createLogHandler,
  getLogsHandler,
} from '../controllers/logs.controller';
import { authenticateApiKey } from '../middleware/auth';
import { logRateLimiter } from '../middleware/rateLimiter';

const logsRouter = Router();

/**
 * POST /
 * Create a single log entry (SDK can use this for single events).
 * Example: POST /api/v1/log with { provider, model, tokens, cost, metadata, timestamp }
 */
logsRouter.post('/', logRateLimiter, authenticateApiKey, createLogHandler);

/**
 * POST /batch
 * Create logs in batch (recommended for SDK efficiency).
 * Example: POST /api/v1/log/batch with [ { provider, model, tokens, cost, ... }, ... ]
 */
logsRouter.post(
  '/batch',
  logRateLimiter,
  authenticateApiKey,
  createBatchLogsHandler,
);

/**
 * GET /
 * Fetch recent logs for dashboard tables.
 * Example: GET /?limit=50&skip=0&provider=openai&projectId=uuid
 */
logsRouter.get('/', authenticateApiKey, getLogsHandler);

export { logsRouter };

