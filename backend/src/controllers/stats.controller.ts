import type { Request, Response } from 'express';
import { endOfMonth, parseISO, startOfMonth } from 'date-fns';

import {
  getDailyStats as fetchDailyStats,
  getMetadataStats as fetchMetadataStats,
  getModelBreakdown as fetchModelBreakdown,
  getProjectStats as fetchProjectStats,
  getProviderBreakdown as fetchProviderBreakdown,
} from '../services/stats.service';
import { logger } from '../utils/logger';

function parseDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

/**
 * Get spend grouped by day for the last N days.
 */
export async function getDailyStats(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const days = req.query.days ? Number(req.query.days) : 30;
  if (!Number.isFinite(days) || days <= 0) {
    res.status(400).json({ error: 'days must be a positive number' });
    return;
  }

  try {
    const stats = await fetchDailyStats(userId, days);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (days - 1));

    res.status(200).json({
      stats,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get daily stats failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get spend grouped by provider for a date range.
 */
export async function getProviderBreakdown(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const startDate = parseDate(req.query.startDate as string | undefined)
    ?? startOfMonth(new Date());
  const endDate = parseDate(req.query.endDate as string | undefined)
    ?? endOfMonth(new Date());

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'Invalid startDate or endDate' });
    return;
  }

  try {
    const providers = await fetchProviderBreakdown(userId, startDate, endDate);
    const totalSpend = providers.reduce((sum, p) => sum + p.spend, 0);

    res.status(200).json({
      providers,
      totalSpend,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get provider breakdown failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get spend grouped by model for a date range.
 */
export async function getModelBreakdown(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const startDate = parseDate(req.query.startDate as string | undefined)
    ?? startOfMonth(new Date());
  const endDate = parseDate(req.query.endDate as string | undefined)
    ?? endOfMonth(new Date());

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'Invalid startDate or endDate' });
    return;
  }

  try {
    const models = await fetchModelBreakdown(userId, startDate, endDate);
    const totalSpend = models.reduce((sum, m) => sum + m.spend, 0);

    res.status(200).json({
      models,
      totalSpend,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get model breakdown failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get spend grouped by project.
 */
export async function getProjectStats(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const projects = await fetchProjectStats(userId);
    res.status(200).json({ projects });
  } catch (error) {
    logger.error('Get project stats failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get spend grouped by a metadata field value.
 */
export async function getMetadataStats(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const key = req.query.key ? String(req.query.key) : '';
  if (!key) {
    res.status(400).json({ error: 'key is required' });
    return;
  }

  const startDate = parseDate(req.query.startDate as string | undefined)
    ?? startOfMonth(new Date());
  const endDate = parseDate(req.query.endDate as string | undefined)
    ?? endOfMonth(new Date());

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'Invalid startDate or endDate' });
    return;
  }

  try {
    const breakdown = await fetchMetadataStats(userId, key, startDate, endDate);
    res.status(200).json({
      key,
      breakdown,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Get metadata stats failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

