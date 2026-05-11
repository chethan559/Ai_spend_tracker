import type { NextFunction, Request, Response } from 'express';
// Import as namespace so Jest spyOn can intercept at call-time.
import * as quotaService from '../services/quota.service';
import { logger } from '../utils/logger';

type AuthedRequest = Request & { user?: { id: string } };

export async function enforceQuota(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as AuthedRequest).user?.id;

    if (!userId) {
      next();
      return;
    }

    const quota = await quotaService.checkEventQuota(userId);

    if (!quota.allowed) {
      res.status(429).json({
        status: 'error',
        code: 'QUOTA_EXCEEDED',
        message: quota.reason,
        quota: {
          current: quota.current,
          limit: quota.limit,
          upgradeUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard/billing`,
        },
      });
      return;
    }

    req.quota = { allowed: quota.allowed, current: quota.current, limit: quota.limit };
    next();
  } catch (error) {
    // Never block ingestion if quota check fails.
    logger.error('Quota check failed — allowing request', error as Error);
    next();
  }
}

export async function enforceBatchQuota(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as AuthedRequest).user?.id;
    // Batch endpoint receives a raw array body.
    const batchSize = Array.isArray(req.body) ? (req.body as unknown[]).length : 0;

    if (!userId || batchSize === 0) {
      next();
      return;
    }

    const quota = await quotaService.checkEventQuota(userId);

    if (!quota.allowed) {
      res.status(429).json({
        status: 'error',
        code: 'QUOTA_EXCEEDED',
        message: quota.reason,
        quota: {
          current: quota.current,
          limit: quota.limit,
          upgradeUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard/billing`,
        },
      });
      return;
    }

    if (quota.limit !== -1) {
      const remaining = quota.limit - quota.current;
      if (batchSize > remaining) {
        req.body = (req.body as unknown[]).slice(0, remaining);
        logger.info('Batch truncated to fit quota', {
          userId,
          requested: batchSize,
          allowed: remaining,
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Batch quota check failed — allowing request', error as Error);
    next();
  }
}
