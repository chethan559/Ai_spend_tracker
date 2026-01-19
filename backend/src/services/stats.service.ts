import { format, startOfDay, subDays } from 'date-fns';

import { Prisma } from '@prisma/client';

import { prisma } from '../config/database';
import {
  fillMissingDates,
  getCurrentMonthRange,
  getDateRange,
} from '../utils/dateHelpers';

export interface DailyStat {
  date: string;
  spend: number;
  requests: number;
}

export interface ProviderStat {
  provider: string;
  spend: number;
  requests: number;
  percentage: number;
}

export interface ModelStat {
  model: string;
  provider: string;
  spend: number;
  requests: number;
  tokens: number;
}

export interface ProjectStat {
  projectId: string;
  projectName: string;
  spend: number;
  requests: number;
}

export interface MetadataStat {
  value: string;
  spend: number;
  requests: number;
}

/**
 * Get spend grouped by day for the last N days.
 */
export async function getDailyStats(
  userId: string,
  days = 30,
): Promise<DailyStat[]> {
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1));

  const rows = await prisma.$queryRaw<
    { date: Date; spend: number; requests: bigint }[]
  >`
    SELECT DATE("timestamp") AS date,
           COALESCE(SUM(cost), 0) AS spend,
           COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${startDate}
      AND "timestamp" <= ${endDate}
    GROUP BY DATE("timestamp")
    ORDER BY DATE("timestamp") ASC
  `;

  const mapped = rows.map((row) => ({
    date: format(row.date, 'yyyy-MM-dd'),
    spend: Number(row.spend),
    requests: Number(row.requests),
  }));

  return fillMissingDates(
    mapped,
    startDate,
    endDate,
    'date',
    ['spend', 'requests'],
  ) as DailyStat[];
}

/**
 * Get spend grouped by provider with percentage of total.
 */
export async function getProviderBreakdown(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<ProviderStat[]> {
  const defaults = getCurrentMonthRange();
  const rangeStart = startDate ?? defaults.startDate;
  const rangeEnd = endDate ?? defaults.endDate;

  const rows = await prisma.$queryRaw<
    { provider: string; spend: number; requests: bigint }[]
  >`
    SELECT provider,
           COALESCE(SUM(cost), 0) AS spend,
           COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${rangeStart}
      AND "timestamp" <= ${rangeEnd}
    GROUP BY provider
    ORDER BY spend DESC
  `;

  const totalSpend = rows.reduce((sum, row) => sum + Number(row.spend), 0);

  return rows.map((row) => ({
    provider: row.provider,
    spend: Number(row.spend),
    requests: Number(row.requests),
    percentage: totalSpend === 0 ? 0 : (Number(row.spend) / totalSpend) * 100,
  }));
}

/**
 * Get spend grouped by model (and provider) for a date range.
 */
export async function getModelBreakdown(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<ModelStat[]> {
  const defaults = getCurrentMonthRange();
  const rangeStart = startDate ?? defaults.startDate;
  const rangeEnd = endDate ?? defaults.endDate;

  const rows = await prisma.$queryRaw<
    {
      model: string;
      provider: string;
      spend: number;
      requests: bigint;
      tokens: number;
    }[]
  >`
    SELECT model,
           provider,
           COALESCE(SUM(cost), 0) AS spend,
           COUNT(*) AS requests,
           COALESCE(SUM(tokens), 0) AS tokens
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${rangeStart}
      AND "timestamp" <= ${rangeEnd}
    GROUP BY model, provider
    ORDER BY spend DESC
  `;

  return rows.map((row) => ({
    model: row.model,
    provider: row.provider,
    spend: Number(row.spend),
    requests: Number(row.requests),
    tokens: Number(row.tokens),
  }));
}

/**
 * Get spend grouped by project, including projects with zero spend.
 */
export async function getProjectStats(
  userId: string,
): Promise<ProjectStat[]> {
  const rows = await prisma.$queryRaw<
    { projectId: string; projectName: string; spend: number; requests: bigint }[]
  >`
    SELECT p.id AS "projectId",
           p.name AS "projectName",
           COALESCE(SUM(l.cost), 0) AS spend,
           COALESCE(COUNT(l.id), 0) AS requests
    FROM "Project" p
    LEFT JOIN "ApiLog" l
      ON l."projectId" = p.id
     AND l."userId" = p."userId"
    WHERE p."userId" = ${userId}
    GROUP BY p.id, p.name
    ORDER BY p.name ASC
  `;

  return rows.map((row) => ({
    projectId: row.projectId,
    projectName: row.projectName,
    spend: Number(row.spend),
    requests: Number(row.requests),
  }));
}

/**
 * Get spend grouped by a metadata field value.
 */
export async function getMetadataStats(
  userId: string,
  metadataKey: string,
  startDate?: Date,
  endDate?: Date,
): Promise<MetadataStat[]> {
  const range = getDateRange(
    startDate?.toISOString(),
    endDate?.toISOString(),
  );
  const rangeStart = range.startDate;
  const rangeEnd = range.endDate;

  const pathParts = metadataKey.split('.').filter(Boolean);
  const pathSql = Prisma.join(
    pathParts.map((part) => Prisma.sql`${part}`),
    ', ',
  );

  const rows = await prisma.$queryRaw<
    { value: string; spend: number; requests: bigint }[]
  >(Prisma.sql`
    SELECT jsonb_extract_path_text("metadata", ${pathSql}) AS value,
           COALESCE(SUM(cost), 0) AS spend,
           COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${rangeStart}
      AND "timestamp" <= ${rangeEnd}
      AND jsonb_extract_path_text("metadata", ${pathSql}) IS NOT NULL
    GROUP BY value
    ORDER BY spend DESC
  `);

  return rows.map((row) => ({
    value: row.value,
    spend: Number(row.spend),
    requests: Number(row.requests),
  }));
}

