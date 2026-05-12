import type { Request, Response } from 'express';
import { endOfMonth, parseISO, startOfMonth } from 'date-fns';

import {
  getDailyStats as fetchDailyStats,
  getMetadataStats as fetchMetadataStats,
  getModelBreakdown as fetchModelBreakdown,
  getProjectStats as fetchProjectStats,
  getProviderBreakdown as fetchProviderBreakdown,
  getProviderDetail as fetchProviderDetail,
  getTotalSpend as fetchTotalSpend,
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
 * Get spend grouped by day, bucketed in the requested timezone.
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

  const timezoneParam = (req.query.timezone as string | undefined) ?? 'UTC';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezoneParam });
  } catch {
    res.status(400).json({ error: 'Invalid timezone' });
    return;
  }

  const days = req.query.days ? Number(req.query.days) : 30;
  if (!Number.isFinite(days) || days <= 0) {
    res.status(400).json({ error: 'days must be a positive number' });
    return;
  }

  const startDate = parseDate(req.query.startDate as string | undefined);
  const endDate = parseDate(req.query.endDate as string | undefined);

  const projectId = (req.query.projectId as string | undefined) || undefined;

  try {
    const stats = await fetchDailyStats(userId, {
      days,
      startDate,
      endDate,
      timezone: timezoneParam,
      projectId,
    });

    res.status(200).json({
      stats,
      period: {
        days,
        startDate: (startDate ?? new Date()).toISOString(),
        endDate: (endDate ?? new Date()).toISOString(),
        timezone: timezoneParam,
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

  const projectId = (req.query.projectId as string | undefined) || undefined;

  try {
    const providers = await fetchProviderBreakdown(userId, startDate, endDate, projectId);
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

  const projectId = (req.query.projectId as string | undefined) || undefined;

  try {
    const models = await fetchModelBreakdown(userId, startDate, endDate, projectId);
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
 * Get per-provider breakdown with daily history and MoM comparison.
 */
export async function getProviderDetailHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const providers = await fetchProviderDetail(userId);
    res.status(200).json({ providers });
  } catch (error) {
    logger.error('Get provider detail failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get total spend with provider breakdown and period-over-period change.
 */
export async function getTotalSpendHandler(
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

  const projectId = (req.query.projectId as string | undefined) || undefined;

  try {
    const result = await fetchTotalSpend(userId, startDate, endDate, projectId);
    res.status(200).json(result);
  } catch (error) {
    logger.error('Get total spend failed', error as Error);
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

  const key = String(req.query.field ?? req.query.key ?? '');
  if (!key) {
    res.status(400).json({ error: 'field is required' });
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

  const projectId = (req.query.projectId as string | undefined) || undefined;

  try {
    const breakdown = await fetchMetadataStats(userId, key, startDate, endDate, projectId);
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

