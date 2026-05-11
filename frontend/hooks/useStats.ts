import { useQuery } from '@tanstack/react-query';
import { formatISO } from 'date-fns';
import {
  getDailyStats,
  getLogs,
  getModelBreakdown,
  getOverview,
  getProviderBreakdown,
  getProviderDetail,
  getTotalSpend,
} from '@/lib/api';
import type { LogsResponse } from '@/lib/api';
import type {
  DailyStat,
  ModelStat,
  ProviderDetail,
  ProviderStat,
  StatsOverview,
  TotalSpendResult,
} from '@/types';

interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: unknown;
  refetch?: () => void;
}

const toIsoDate = (date?: Date) => (date ? formatISO(date, { representation: 'date' }) : undefined);

const browserTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Fetch overview stats for an optional date range.
 */
export function useOverviewStats(
  startDate?: Date,
  endDate?: Date,
): UseQueryResult<StatsOverview> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'overview', start, end, timezone],
    queryFn: () => getOverview(start, end),
    enabled,
    refetchInterval: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch daily stats for the last N days, bucketed in the browser's timezone.
 */
export function useDailyStats(days = 30): UseQueryResult<DailyStat[]> {
  const timezone = browserTimezone();

  const query = useQuery({
    queryKey: ['stats', 'daily', days, timezone],
    queryFn: () => getDailyStats(days, timezone),
    refetchInterval: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Fetch provider breakdown for an optional date range.
 */
export function useProviderBreakdown(
  startDate?: Date,
  endDate?: Date,
): UseQueryResult<ProviderStat[]> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'providers', start, end, timezone],
    queryFn: () => getProviderBreakdown(start, end),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

/**
 * Fetch per-provider breakdown with daily history, MoM comparison, top models.
 */
export function useProviderDetail(): UseQueryResult<ProviderDetail[]> {
  const query = useQuery({
    queryKey: ['stats', 'provider-detail'],
    queryFn: async () => {
      const res = await getProviderDetail();
      return res.providers;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch total spend with provider breakdown and period-over-period change.
 */
export function useTotalSpend(
  startDate?: Date,
  endDate?: Date,
): UseQueryResult<TotalSpendResult> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'total-spend', start, end, timezone],
    queryFn: () => getTotalSpend(start, end),
    enabled,
    refetchInterval: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Fetch the 20 most recent logs, refreshing every 10 seconds.
 */
export function useLiveFeed() {
  const query = useQuery({
    queryKey: ['logs', 'live-feed'],
    queryFn: () => getLogs({ limit: 20 }),
    refetchInterval: 10_000,
    staleTime: 0,
  });

  return {
    data: query.data as LogsResponse | undefined,
    isLoading: query.isLoading,
    error: query.error,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

/**
 * Fetch model breakdown for an optional date range.
 */
export function useModelBreakdown(
  startDate?: Date,
  endDate?: Date,
): UseQueryResult<ModelStat[]> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'models', start, end, timezone],
    queryFn: () => getModelBreakdown(start, end),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
