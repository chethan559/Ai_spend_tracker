import { useQuery } from '@tanstack/react-query';
import { formatISO, subDays } from 'date-fns';
import { getFeatureLogs, getMetadataStats } from '@/lib/api';
import type { DailyStat, MetadataStat } from '@/types';

export interface DateRange {
  from: Date;
  to: Date;
}

const toIsoDate = (date?: Date) =>
  date ? formatISO(date, { representation: 'date' }) : undefined;

export function useMetadataStats(field: string, dateRange: DateRange) {
  const start = toIsoDate(dateRange.from);
  const end = toIsoDate(dateRange.to);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const query = useQuery({
    queryKey: ['stats', 'metadata', field, start, end, timezone],
    queryFn: () => getMetadataStats(field, start, end),
    enabled: Boolean(field && field.trim()),
    staleTime: 10 * 60_000,
  });

  return {
    data: query.data as MetadataStat[] | undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useFeatureLogs(field: string, value: string, dateRange: DateRange) {
  const start = toIsoDate(dateRange.from);
  const end = toIsoDate(dateRange.to);

  const query = useQuery({
    queryKey: ['logs', 'metadata', field, value, start, end],
    queryFn: () =>
      getFeatureLogs({
        metadataField: field,
        metadataValue: value,
        startDate: start,
        endDate: end,
        limit: 500,
      }),
    enabled: Boolean(field && value),
    staleTime: 10 * 60_000,
  });

  const dailyData: DailyStat[] = [];
  if (query.data?.logs) {
    const byDay = new Map<string, { spend: number; requests: number }>();
    for (const log of query.data.logs) {
      const day = log.timestamp.slice(0, 10);
      const prev = byDay.get(day) ?? { spend: 0, requests: 0 };
      byDay.set(day, { spend: prev.spend + log.cost, requests: prev.requests + 1 });
    }
    for (const [date, stats] of Array.from(byDay).sort(([a], [b]) => a.localeCompare(b))) {
      dailyData.push({ date, spend: stats.spend, requests: stats.requests });
    }
  }

  return {
    logs: query.data?.logs,
    dailyData,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useFeatureSparkline(field: string, value: string) {
  return useFeatureLogs(field, value, {
    from: subDays(new Date(), 7),
    to: new Date(),
  });
}
