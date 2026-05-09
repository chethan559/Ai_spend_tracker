import { startOfMonth, endOfMonth } from 'date-fns';
import { Prisma } from '@prisma/client';

import { prisma } from '../config/database';
import { logger } from '../utils/logger';

export interface LogInputData {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  cost: number;
  metadata?: Prisma.InputJsonValue;
  timestamp?: string;
}

export interface RecentLogsOptions {
  limit?: number;
  skip?: number;
  provider?: string;
  projectId?: string;
}

export interface RecentLogsResult {
  logs: unknown[];
  pagination: {
    limit: number;
    skip: number;
    total: number;
  };
}

export interface UserStatsResult {
  totalSpend: number;
  totalRequests: number;
  avgCost: number;
}

const getProjectIdFromMetadata = (
  metadata: Prisma.InputJsonValue | undefined,
): string | undefined => {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return undefined;
  }
  const value = (metadata as Record<string, unknown>).projectId;
  return typeof value === 'string' ? value : undefined;
};

export async function createLog(
  userId: string,
  logData: LogInputData,
) {
  try {
    const projectId = getProjectIdFromMetadata(logData.metadata);

    const createdLog = await prisma.apiLog.create({
      data: {
        userId,
        provider: logData.provider,
        model: logData.model,
        inputTokens: logData.inputTokens,
        outputTokens: logData.outputTokens,
        latencyMs: logData.latencyMs,
        cost: logData.cost,
        metadata: (logData.metadata ?? undefined) as Prisma.InputJsonValue,
        projectId,
        timestamp: logData.timestamp
          ? new Date(logData.timestamp)
          : new Date(),
      },
    });

    logger.info('Log created', { userId, logId: createdLog.id });
    return createdLog;
  } catch (error) {
    logger.error('Failed to create log', error as Error);
    throw error;
  }
}

export async function createBatchLogs(
  userId: string,
  logs: LogInputData[],
): Promise<number> {
  try {
    const data = logs.map((log) => ({
      userId,
      provider: log.provider,
      model: log.model,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      latencyMs: log.latencyMs,
      cost: log.cost,
      metadata: (log.metadata ?? undefined) as Prisma.InputJsonValue,
      projectId: getProjectIdFromMetadata(log.metadata),
      timestamp: log.timestamp ? new Date(log.timestamp) : new Date(),
    }));

    const result = await prisma.apiLog.createMany({ data });
    logger.info('Batch logs created', { userId, count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Failed to create batch logs', error as Error);
    throw error;
  }
}

export async function getRecentLogs(
  userId: string,
  options: RecentLogsOptions = {},
): Promise<RecentLogsResult> {
  try {
    const limit = options.limit ?? 50;
    const skip = options.skip ?? 0;

    const where = {
      userId,
      ...(options.provider ? { provider: options.provider } : {}),
      ...(options.projectId ? { projectId: options.projectId } : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: { project: true },
      }),
      prisma.apiLog.count({ where }),
    ]);

    return {
      logs,
      pagination: { limit, skip, total },
    };
  } catch (error) {
    logger.error('Failed to fetch recent logs', error as Error);
    throw error;
  }
}

export async function getUserStats(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<UserStatsResult> {
  try {
    const rangeStart = startDate ?? startOfMonth(new Date());
    const rangeEnd = endDate ?? endOfMonth(new Date());

    const where = {
      userId,
      timestamp: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    };

    const [aggregate, totalRequests] = await Promise.all([
      prisma.apiLog.aggregate({
        where,
        _sum: { cost: true },
      }),
      prisma.apiLog.count({ where }),
    ]);

    const totalSpend = aggregate._sum.cost ?? 0;
    const avgCost = totalRequests === 0 ? 0 : totalSpend / totalRequests;

    return { totalSpend, totalRequests, avgCost };
  } catch (error) {
    logger.error('Failed to calculate user stats', error as Error);
    throw error;
  }
}
