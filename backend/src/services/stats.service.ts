import { endOfMonth, format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';

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
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
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

export interface TotalSpendProvider {
  provider: string;
  cost: number;
  requests: number;
}

export interface TotalSpendResult {
  totalCost: number;
  totalRequests: number;
  byProvider: TotalSpendProvider[];
  weekOverWeekChange: number | null;
  dateRange: { start: string; end: string };
}

/**
 * Get spend grouped by day, bucketed in the given timezone.
 */
export async function getDailyStats(
  userId: string,
  options: { days?: number; startDate?: Date; endDate?: Date; timezone?: string; projectId?: string } = {},
): Promise<DailyStat[]> {
  const timezone = options.timezone ?? 'UTC';

  let startDate: Date;
  let endDate: Date;

  if (options.startDate && options.endDate) {
    startDate = options.startDate;
    endDate = options.endDate;
  } else {
    const days = options.days ?? 30;
    endDate = new Date(); // current moment — includes all logs created today
    startDate = startOfDay(subDays(endDate, days - 1));
  }

  const projectFilter = options.projectId
    ? Prisma.sql`AND "projectId" = ${options.projectId}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<
    { date: Date; spend: number; requests: bigint }[]
  >(Prisma.sql`
    SELECT DATE(("timestamp" AT TIME ZONE 'UTC') AT TIME ZONE ${timezone}::text) AS date,
           COALESCE(SUM(cost), 0) AS spend,
           COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${startDate}
      AND "timestamp" <= ${endDate}
      ${projectFilter}
    GROUP BY 1
    ORDER BY 1 ASC
  `);

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
  projectId?: string,
): Promise<ProviderStat[]> {
  const defaults = getCurrentMonthRange();
  const rangeStart = startDate ?? defaults.startDate;
  const rangeEnd = endDate ?? defaults.endDate;

  const projectFilter = projectId
    ? Prisma.sql`AND "projectId" = ${projectId}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<
    { provider: string; spend: number; requests: bigint }[]
  >(Prisma.sql`
    SELECT provider,
           COALESCE(SUM(cost), 0) AS spend,
           COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${rangeStart}
      AND "timestamp" <= ${rangeEnd}
      ${projectFilter}
    GROUP BY provider
    ORDER BY spend DESC
  `);

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
  projectId?: string,
): Promise<ModelStat[]> {
  const defaults = getCurrentMonthRange();
  const rangeStart = startDate ?? defaults.startDate;
  const rangeEnd = endDate ?? defaults.endDate;

  const projectFilter = projectId
    ? Prisma.sql`AND "projectId" = ${projectId}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<
    {
      model: string;
      provider: string;
      spend: number;
      requests: bigint;
      inputTokens: number;
      outputTokens: number;
    }[]
  >(Prisma.sql`
    SELECT model,
           provider,
           COALESCE(SUM(cost), 0)          AS spend,
           COUNT(*)                         AS requests,
           COALESCE(SUM("inputTokens"), 0)  AS "inputTokens",
           COALESCE(SUM("outputTokens"), 0) AS "outputTokens"
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${rangeStart}
      AND "timestamp" <= ${rangeEnd}
      ${projectFilter}
    GROUP BY model, provider
    ORDER BY spend DESC
  `);

  return rows.map((row) => ({
    model: row.model,
    provider: row.provider,
    spend: Number(row.spend),
    requests: Number(row.requests),
    inputTokens: Number(row.inputTokens),
    outputTokens: Number(row.outputTokens),
    totalTokens: Number(row.inputTokens) + Number(row.outputTokens),
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
  projectId?: string,
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

  const projectFilter = projectId
    ? Prisma.sql`AND "projectId" = ${projectId}`
    : Prisma.sql``;

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
      ${projectFilter}
    GROUP BY value
    ORDER BY spend DESC
  `);

  return rows.map((row) => ({
    value: row.value,
    spend: Number(row.spend),
    requests: Number(row.requests),
  }));
}

export interface ProviderDetailModel {
  model: string;
  cost: number;
  requests: number;
}

export interface ProviderDetail {
  provider: string;
  status: 'active' | 'idle' | 'no_data';
  lastActivity: string | null;
  thisMonth: { cost: number; requests: number };
  lastMonth: { cost: number; requests: number };
  momChange: number | null;
  topModel: string | null;
  avgCostPerRequest: number;
  daily: DailyStat[];
  topModels: ProviderDetailModel[];
  peakDay: { date: string; cost: number } | null;
  projectedMonthCost: number | null;
}

const KNOWN_PROVIDERS = ['openai', 'anthropic', 'google', 'cohere', 'replicate'];

/**
 * Get per-provider breakdown with daily history and MoM comparison.
 */
export async function getProviderDetail(userId: string): Promise<ProviderDetail[]> {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const thirtyDaysAgo = startOfDay(subDays(now, 29));

  const monthlyRows = await prisma.$queryRaw<
    {
      provider: string;
      this_cost: number;
      this_requests: bigint;
      last_cost: number;
      last_requests: bigint;
      last_activity: Date | null;
    }[]
  >`
    SELECT
      provider,
      COALESCE(SUM(CASE WHEN "timestamp" >= ${thisMonthStart} THEN cost ELSE 0 END), 0)     AS this_cost,
      COUNT(CASE WHEN "timestamp" >= ${thisMonthStart} THEN 1 ELSE NULL END)                 AS this_requests,
      COALESCE(SUM(CASE WHEN "timestamp" >= ${lastMonthStart} AND "timestamp" < ${thisMonthStart} THEN cost ELSE 0 END), 0) AS last_cost,
      COUNT(CASE WHEN "timestamp" >= ${lastMonthStart} AND "timestamp" < ${thisMonthStart} THEN 1 ELSE NULL END)            AS last_requests,
      MAX("timestamp") AS last_activity
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${lastMonthStart}
    GROUP BY provider
  `;

  const dailyRows = await prisma.$queryRaw<
    { provider: string; date: Date; spend: number; requests: bigint }[]
  >`
    SELECT
      provider,
      DATE("timestamp") AS date,
      COALESCE(SUM(cost), 0) AS spend,
      COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${thirtyDaysAgo}
    GROUP BY provider, DATE("timestamp")
    ORDER BY provider, date ASC
  `;

  const modelRows = await prisma.$queryRaw<
    { provider: string; model: string; cost: number; requests: bigint }[]
  >`
    SELECT
      provider,
      model,
      COALESCE(SUM(cost), 0) AS cost,
      COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${thisMonthStart}
    GROUP BY provider, model
    ORDER BY provider, cost DESC
  `;

  const monthlyMap = new Map(monthlyRows.map((r) => [r.provider, r]));

  const dailyByProvider = new Map<string, { date: string; spend: number; requests: number }[]>();
  for (const row of dailyRows) {
    const dateStr = format(row.date, 'yyyy-MM-dd');
    const arr = dailyByProvider.get(row.provider) ?? [];
    arr.push({ date: dateStr, spend: Number(row.spend), requests: Number(row.requests) });
    dailyByProvider.set(row.provider, arr);
  }

  const modelsByProvider = new Map<string, ProviderDetailModel[]>();
  for (const row of modelRows) {
    const arr = modelsByProvider.get(row.provider) ?? [];
    arr.push({ model: row.model, cost: Number(row.cost), requests: Number(row.requests) });
    modelsByProvider.set(row.provider, arr);
  }

  const dataProviders = new Set([
    ...monthlyMap.keys(),
    ...dailyByProvider.keys(),
    ...modelsByProvider.keys(),
  ]);
  const allProviders = [...new Set([...KNOWN_PROVIDERS, ...dataProviders])];

  const daysInMonth = endOfMonth(now).getDate();
  const daysElapsed = now.getDate();

  return allProviders.map((provider) => {
    const monthly = monthlyMap.get(provider);
    const rawDaily = dailyByProvider.get(provider) ?? [];
    const topModels = (modelsByProvider.get(provider) ?? []).slice(0, 3);

    const thisCost = monthly ? Number(monthly.this_cost) : 0;
    const thisRequests = monthly ? Number(monthly.this_requests) : 0;
    const lastCost = monthly ? Number(monthly.last_cost) : 0;
    const lastRequests = monthly ? Number(monthly.last_requests) : 0;
    const lastActivity = monthly?.last_activity ?? null;

    let status: ProviderDetail['status'] = 'no_data';
    if (lastActivity) {
      const daysSince = (now.getTime() - lastActivity.getTime()) / 86_400_000;
      status = daysSince <= 7 ? 'active' : 'idle';
    }

    const momChange = lastCost > 0 ? ((thisCost - lastCost) / lastCost) * 100 : null;
    const avgCostPerRequest = thisRequests > 0 ? thisCost / thisRequests : 0;
    const topModel = topModels[0]?.model ?? null;

    let peakDay: ProviderDetail['peakDay'] = null;
    for (const d of rawDaily) {
      if (!peakDay || d.spend > peakDay.cost) {
        peakDay = { date: d.date, cost: d.spend };
      }
    }

    const projectedMonthCost =
      daysElapsed > 0 && thisCost > 0
        ? (thisCost / daysElapsed) * daysInMonth
        : null;

    const daily = fillMissingDates(
      rawDaily,
      thirtyDaysAgo,
      now,
      'date',
      ['spend', 'requests'],
    ) as DailyStat[];

    return {
      provider,
      status,
      lastActivity: lastActivity?.toISOString() ?? null,
      thisMonth: { cost: thisCost, requests: thisRequests },
      lastMonth: { cost: lastCost, requests: lastRequests },
      momChange,
      topModel,
      avgCostPerRequest,
      daily,
      topModels,
      peakDay,
      projectedMonthCost,
    };
  });
}

/**
 * Get total spend with provider breakdown and period-over-period change.
 */
export async function getTotalSpend(
  userId: string,
  startDate: Date,
  endDate: Date,
  projectId?: string,
): Promise<TotalSpendResult> {
  const projectFilter = projectId
    ? Prisma.sql`AND "projectId" = ${projectId}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw<
    { provider: string; cost: number; requests: bigint }[]
  >(Prisma.sql`
    SELECT provider,
           COALESCE(SUM(cost), 0) AS cost,
           COUNT(*) AS requests
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${startDate}
      AND "timestamp" <= ${endDate}
      ${projectFilter}
    GROUP BY provider
    ORDER BY cost DESC
  `);

  const periodMs = endDate.getTime() - startDate.getTime();
  const prevEnd = new Date(startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - periodMs);

  const prevRows = await prisma.$queryRaw<{ cost: number }[]>(Prisma.sql`
    SELECT COALESCE(SUM(cost), 0) AS cost
    FROM "ApiLog"
    WHERE "userId" = ${userId}
      AND "timestamp" >= ${prevStart}
      AND "timestamp" <= ${prevEnd}
      ${projectFilter}
  `);

  const totalCost = rows.reduce((sum, r) => sum + Number(r.cost), 0);
  const totalRequests = rows.reduce((sum, r) => sum + Number(r.requests), 0);
  const prevCost = prevRows[0] ? Number(prevRows[0].cost) : 0;
  const weekOverWeekChange =
    prevCost > 0 ? ((totalCost - prevCost) / prevCost) * 100 : null;

  return {
    totalCost,
    totalRequests,
    byProvider: rows.map((r) => ({
      provider: r.provider,
      cost: Number(r.cost),
      requests: Number(r.requests),
    })),
    weekOverWeekChange,
    dateRange: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}
