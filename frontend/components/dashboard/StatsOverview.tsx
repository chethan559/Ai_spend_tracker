'use client';

import { Activity, DollarSign, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { StatsOverview as StatsType, TotalSpendResult } from '@/types';
import SummaryCard from './SummaryCard';

interface StatsOverviewProps {
  data: StatsType | undefined;
  isLoading: boolean;
  totalSpend?: TotalSpendResult;
  totalSpendLoading?: boolean;
  activeProvider?: string | null;
  onProviderFilter?: (provider: string | null) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US').format(value);

function TotalSpendHero({
  data,
  isLoading,
  activeProvider,
  onProviderFilter,
}: {
  data: TotalSpendResult | undefined;
  isLoading: boolean;
  activeProvider?: string | null;
  onProviderFilter?: (provider: string | null) => void;
}) {
  const wowChange = data?.weekOverWeekChange ?? null;

  return (
    <div
      className="relative overflow-hidden rounded-xl p-6"
      style={{
        background: '#111113',
        border: '1px solid #1c1c1f',
        /* Subtle orange gradient in top-left corner */
      }}
    >
      {/* Orange glow */}
      <div
        className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
        }}
      />

      {isLoading || !data ? (
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-24" style={{ background: '#1c1c1f' }} />
          <Skeleton className="h-12 w-44" style={{ background: '#1c1c1f' }} />
          <Skeleton className="h-3.5 w-56" style={{ background: '#1c1c1f' }} />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-7 w-24 rounded-full" style={{ background: '#1c1c1f' }} />
            <Skeleton className="h-7 w-24 rounded-full" style={{ background: '#1c1c1f' }} />
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#f97316' }}>
              Total AI Spend
            </p>
            <div
              className="mt-2 text-5xl font-bold tabular-nums"
              style={{ letterSpacing: '-0.03em', color: '#ffffff' }}
            >
              {formatCurrency(data.totalCost)}
            </div>
            <p className="mt-2 text-sm" style={{ color: '#71717a' }}>
              across {data.byProvider.length} provider{data.byProvider.length !== 1 ? 's' : ''}
              {' · '}
              {formatNumber(data.totalRequests)} requests
            </p>
            {wowChange !== null && (
              <div
                className={cn(
                  'mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  wowChange > 0
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-green-500/10 text-green-400',
                )}
              >
                {wowChange > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {wowChange > 0 ? '+' : ''}
                {wowChange.toFixed(1)}% vs prev period
              </div>
            )}
          </div>

          {data.byProvider.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.byProvider.map((p) => {
                const isSelected = activeProvider === p.provider;
                return (
                  <button
                    key={p.provider}
                    onClick={() => onProviderFilter?.(isSelected ? null : p.provider)}
                    className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                    style={{
                      border: isSelected ? '1px solid #f97316' : '1px solid #1c1c1f',
                      background: isSelected ? 'rgba(249,115,22,0.12)' : 'transparent',
                      color: isSelected ? '#f97316' : '#71717a',
                    }}
                  >
                    {p.provider} · {formatCurrency(p.cost)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StatsOverview({
  data,
  isLoading,
  totalSpend,
  totalSpendLoading,
  activeProvider,
  onProviderFilter,
}: StatsOverviewProps) {
  const totalSpendVal = data?.totalSpend ?? 0;
  const totalRequests = data?.totalRequests ?? 0;
  const avgCost = data?.avgCost ?? 0;
  const costPer1k = totalRequests > 0 ? (totalSpendVal / totalRequests) * 1000 : 0;

  return (
    <div className="space-y-4">
      <TotalSpendHero
        data={totalSpend}
        isLoading={totalSpendLoading ?? isLoading}
        activeProvider={activeProvider}
        onProviderFilter={onProviderFilter}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Spend"
          value={formatCurrency(totalSpendVal)}
          description="Total API costs"
          icon={DollarSign}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Total Requests"
          value={formatNumber(totalRequests)}
          description="API calls made"
          icon={Activity}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Average Cost"
          value={formatCurrency(avgCost)}
          description="Per request"
          icon={TrendingUp}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cost per 1K Requests"
          value={formatCurrency(costPer1k)}
          description="At current rate"
          icon={Zap}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
