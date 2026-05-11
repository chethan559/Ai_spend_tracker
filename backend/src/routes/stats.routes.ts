import { Router } from 'express';
import type { Request, Response } from 'express';

import { getOverviewHandler } from '../controllers/logs.controller';
import {
  getDailyStats,
  getMetadataStats,
  getModelBreakdown,
  getProjectStats,
  getProviderBreakdown,
  getProviderDetailHandler,
  getTotalSpendHandler,
} from '../controllers/stats.controller';
import { authenticateJWT } from '../middleware/auth';
import { getQuotaStatus } from '../services/quota.service';
import { logger } from '../utils/logger';

const statsRouter = Router();

statsRouter.get('/overview', authenticateJWT, getOverviewHandler);
statsRouter.get('/daily', authenticateJWT, getDailyStats);
statsRouter.get('/by-provider', authenticateJWT, getProviderBreakdown);
statsRouter.get('/by-model', authenticateJWT, getModelBreakdown);
statsRouter.get('/by-project', authenticateJWT, getProjectStats);
statsRouter.get('/by-metadata', authenticateJWT, getMetadataStats);
statsRouter.get('/total-spend', authenticateJWT, getTotalSpendHandler);
statsRouter.get('/by-provider-detail', authenticateJWT, getProviderDetailHandler);

statsRouter.get(
  '/quota',
  authenticateJWT,
  async (req: Request, res: Response) => {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    try {
      const quota = await getQuotaStatus(userId);
      res.json({ status: 'success', data: quota });
    } catch (error) {
      logger.error('Failed to get quota status', error as Error);
      res.status(500).json({ status: 'error', message: 'Failed to get quota status' });
    }
  },
);

export { statsRouter };
