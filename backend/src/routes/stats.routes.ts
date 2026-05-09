import { Router } from 'express';

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
import { apiRateLimiter } from '../middleware/rateLimiter';

const statsRouter = Router();

/**
 * GET /overview
 * Aggregate totals for spend and requests.
 */
statsRouter.get('/overview', apiRateLimiter, authenticateJWT, getOverviewHandler);

/**
 * GET /daily
 * Daily spend and request counts.
 */
statsRouter.get('/daily', apiRateLimiter, authenticateJWT, getDailyStats);

/**
 * GET /by-provider
 * Spend breakdown by AI provider.
 */
statsRouter.get(
  '/by-provider',
  apiRateLimiter,
  authenticateJWT,
  getProviderBreakdown,
);

/**
 * GET /by-model
 * Spend breakdown by model.
 */
statsRouter.get(
  '/by-model',
  apiRateLimiter,
  authenticateJWT,
  getModelBreakdown,
);

/**
 * GET /by-project
 * Spend breakdown by project.
 */
statsRouter.get('/by-project', apiRateLimiter, authenticateJWT, getProjectStats);

/**
 * GET /by-metadata
 * Spend breakdown by metadata field.
 */
statsRouter.get(
  '/by-metadata',
  apiRateLimiter,
  authenticateJWT,
  getMetadataStats,
);

/**
 * GET /total-spend
 * Total spend with provider breakdown and period-over-period change.
 */
statsRouter.get(
  '/total-spend',
  apiRateLimiter,
  authenticateJWT,
  getTotalSpendHandler,
);

/**
 * GET /by-provider-detail
 * Per-provider breakdown with daily history, MoM comparison, top models.
 */
statsRouter.get(
  '/by-provider-detail',
  apiRateLimiter,
  authenticateJWT,
  getProviderDetailHandler,
);

export { statsRouter };

