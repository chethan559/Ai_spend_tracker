import type { Request, Response } from 'express';

import { Prisma } from '@prisma/client';

import {
  createBatchLogs,
  createLog,
  getRecentLogs,
  getUserStats,
} from '../services/logs.service';
import { checkBudgetThresholds } from '../services/alert.service';
import { logSchema, batchLogSchema, statsQuerySchema, validateRequest } from '../utils/validators';
import { logger } from '../utils/logger';

/**
 * Create a single API log entry.
 */
export async function createLogHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = validateRequest(logSchema, req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const log = await createLog(userId, {
      ...validation.data,
      metadata: validation.data.metadata as Prisma.InputJsonValue | undefined,
    });
    res.status(201).json({ message: 'Log created', log });

    // Non-blocking — must not delay or fail the response.
    checkBudgetThresholds(userId).catch((err: Error) =>
      logger.error('Budget threshold check failed', err),
    );
  } catch (error) {
    logger.error('Create log failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Create multiple log entries in a batch.
 */
export async function createBatchLogsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const validation = validateRequest(batchLogSchema, req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const logs = validation.data.map((log) => ({
      ...log,
      metadata: log.metadata as Prisma.InputJsonValue | undefined,
    }));
    const count = await createBatchLogs(userId, logs);
    res.status(201).json({ message: 'Logs created', count });

    // Non-blocking — must not delay or fail the response.
    checkBudgetThresholds(userId).catch((err: Error) =>
      logger.error('Budget threshold check failed', err),
    );
  } catch (error) {
    logger.error('Create batch logs failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Fetch recent logs with optional filters.
 */
export async function getLogsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const skip = req.query.skip ? Number(req.query.skip) : undefined;
  const provider = req.query.provider ? String(req.query.provider) : undefined;
  const projectId = req.query.projectId ? String(req.query.projectId) : undefined;

  try {
    const result = await getRecentLogs(userId, {
      limit,
      skip,
      provider,
      projectId,
    });
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get logs failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Fetch overview stats for a user.
 */
export async function getOverviewHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const validation = validateRequest(statsQuerySchema, req.query);
  if (!validation.success) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  const start = validation.data.startDate
    ? new Date(validation.data.startDate)
    : undefined;
  const end = validation.data.endDate
    ? new Date(validation.data.endDate)
    : undefined;

  try {
    const stats = await getUserStats(userId, start, end);
    res.status(200).json({
      ...stats,
      period: {
        start: start?.toISOString(),
        end: end?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get overview failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

