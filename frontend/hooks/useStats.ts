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

export function useOverviewStats(
  startDate?: Date,
  endDate?: Date,
  projectId?: string | null,
): UseQueryResult<StatsOverview> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'overview', start, end, timezone, projectId ?? null],
    queryFn: () => getOverview(start, end, projectId),
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

export function useDailyStats(days = 30, projectId?: string | null): UseQueryResult<DailyStat[]> {
  const timezone = browserTimezone();

  const query = useQuery({
    queryKey: ['stats', 'daily', days, timezone, projectId ?? null],
    queryFn: () => getDailyStats(days, timezone, projectId),
    refetchInterval: 30_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useProviderBreakdown(
  startDate?: Date,
  endDate?: Date,
  projectId?: string | null,
): UseQueryResult<ProviderStat[]> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'providers', start, end, timezone, projectId ?? null],
    queryFn: () => getProviderBreakdown(start, end, projectId),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}

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

export function useTotalSpend(
  startDate?: Date,
  endDate?: Date,
  projectId?: string | null,
): UseQueryResult<TotalSpendResult> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'total-spend', start, end, timezone, projectId ?? null],
    queryFn: () => getTotalSpend(start, end, projectId),
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

export function useModelBreakdown(
  startDate?: Date,
  endDate?: Date,
  projectId?: string | null,
): UseQueryResult<ModelStat[]> {
  const start = toIsoDate(startDate);
  const end = toIsoDate(endDate);
  const timezone = browserTimezone();
  const enabled = Boolean(!startDate || !endDate || (start && end));

  const query = useQuery({
    queryKey: ['stats', 'models', start, end, timezone, projectId ?? null],
    queryFn: () => getModelBreakdown(start, end, projectId),
    enabled,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
