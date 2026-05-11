import { Router } from 'express';

import {
  createBatchLogsHandler,
  createLogHandler,
  getLogsHandler,
} from '../controllers/logs.controller';
import { authenticateAny, authenticateApiKey } from '../middleware/auth';
import { enforceQuota, enforceBatchQuota } from '../middleware/checkQuota';
import { recalculateCosts } from '../middleware/recalculateCosts';

const logsRouter = Router();

logsRouter.post('/', authenticateApiKey, enforceQuota, recalculateCosts, createLogHandler);

logsRouter.post(
  '/batch',
  authenticateApiKey,
  enforceBatchQuota,
  recalculateCosts,
  createBatchLogsHandler,
);

logsRouter.get('/', authenticateAny, getLogsHandler);

export { logsRouter };
