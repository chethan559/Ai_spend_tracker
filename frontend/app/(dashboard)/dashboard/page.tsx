'use client';

import { useState } from 'react';
import { subDays } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import StatsOverview from '@/components/dashboard/StatsOverview';
import DailySpendChart from '@/components/charts/DailySpendChart';
import ProviderPieChart from '@/components/charts/ProviderPieChart';
import ModelBarChart from '@/components/charts/ModelBarChart';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import FeatureBreakdownTable from '@/components/FeatureBreakdownTable';
import UserCostTable from '@/components/UserCostTable';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDailyStats,
  useModelBreakdown,
  useOverviewStats,
  useProviderBreakdown,
} from '@/hooks/useStats';
import { useMetadataStats } from '@/hooks/useMetadataStats';
import type { MetadataField } from '@/components/MetadataFilterBar';

const PERIODS: { label: string; days: number }[] = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
];

export default function OverviewPage() {
  const [dateRange, setDateRange] = useState(() => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  }));
  const [metadataField, setMetadataField] = useState<MetadataField>('feature');

  const overviewStats = useOverviewStats(dateRange.from, dateRange.to);
  const dailyStats    = useDailyStats(30);
  const providerStats = useProviderBreakdown(dateRange.from, dateRange.to);
  const modelStats    = useModelBreakdown(dateRange.from, dateRange.to);
  const metadataStats = useMetadataStats(metadataField, dateRange);

  const isRefreshing =
    overviewStats.isLoading || dailyStats.isLoading ||
    providerStats.isLoading || modelStats.isLoading;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        overviewStats.refetch?.(),
        dailyStats.refetch?.(),
        providerStats.refetch?.(),
        modelStats.refetch?.(),
        metadataStats.refetch?.(),
      ]);
      toast.success('Refreshed');
    } catch {
      toast.error('Refresh failed');
    }
  };

  const handlePeriod = (days: number) => {
    setDateRange({ from: subDays(new Date(), days), to: new Date() });
  };

  return (
    <div style={{ color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sub-header: date controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid #1c1c1f',
          background: '#0a0a0b',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Period quick-select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {PERIODS.map(({ label, days }) => {
            const active =
              Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) === days - 1 ||
              Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000) === days;
            return (
              <button
                key={label}
                onClick={() => handlePeriod(days)}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: active ? '#1c1c1f' : 'transparent',
                  color: active ? '#fff' : '#52525b',
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            );
          })}
          <span style={{ color: '#27272a', fontSize: 14, margin: '0 4px' }}>|</span>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(from, to) => from && to && setDateRange({ from, to })}
          />
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: '#52525b',
            background: 'none',
            border: 'none',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: isRefreshing ? 0.5 : 1,
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
          />
          Refresh
        </button>
      </div>

      {/* ── Stats row ── */}
      {overviewStats.error ? (
        <div style={{ padding: '12px 20px' }}>
          <ErrorMessage message="Failed to load stats" onRetry={overviewStats.refetch} />
        </div>
      ) : (
        <StatsOverview data={overviewStats.data} isLoading={overviewStats.isLoading} />
      )}

      {/* ── Main content ── */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Daily chart */}
        {dailyStats.error ? (
          <ErrorMessage message="Failed to load daily spend" onRetry={dailyStats.refetch} />
        ) : (
          <DailySpendChart data={dailyStats.data} isLoading={dailyStats.isLoading} />
        )}

        {/* Provider + Model */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16 }}>
          {providerStats.error ? (
            <ErrorMessage message="Failed to load provider breakdown" onRetry={providerStats.refetch} />
          ) : (
            <ProviderPieChart data={providerStats.data} isLoading={providerStats.isLoading} />
          )}
          {modelStats.error ? (
            <ErrorMessage message="Failed to load model breakdown" onRetry={modelStats.refetch} />
          ) : (
            <ModelBarChart data={modelStats.data} isLoading={modelStats.isLoading} />
          )}
        </div>

        {/* Metadata breakdown */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b', marginBottom: 12 }}>
            Breakdown
          </p>
          <Tabs
            value={metadataField}
            onValueChange={(v) => setMetadataField(v as MetadataField)}
          >
            <TabsList>
              <TabsTrigger value="feature">By Feature</TabsTrigger>
              <TabsTrigger value="userId">By User</TabsTrigger>
              <TabsTrigger value="environment">By Environment</TabsTrigger>
            </TabsList>

            <TabsContent value="feature" className="mt-4">
              {metadataStats.error && metadataField === 'feature' ? (
                <ErrorMessage message="Failed to load feature breakdown" onRetry={metadataStats.refetch} />
              ) : (
                <FeatureBreakdownTable
                  field="feature"
                  data={metadataField === 'feature' ? metadataStats.data : undefined}
                  isLoading={metadataField === 'feature' && metadataStats.isLoading}
                  dateRange={dateRange}
                />
              )}
            </TabsContent>

            <TabsContent value="userId" className="mt-4">
              {metadataStats.error && metadataField === 'userId' ? (
                <ErrorMessage message="Failed to load user breakdown" onRetry={metadataStats.refetch} />
              ) : (
                <UserCostTable
                  data={metadataField === 'userId' ? metadataStats.data : undefined}
                  isLoading={metadataField === 'userId' && metadataStats.isLoading}
                  dateRange={dateRange}
                />
              )}
            </TabsContent>

            <TabsContent value="environment" className="mt-4">
              {metadataStats.error && metadataField === 'environment' ? (
                <ErrorMessage message="Failed to load environment breakdown" onRetry={metadataStats.refetch} />
              ) : (
                <FeatureBreakdownTable
                  field="environment"
                  data={metadataField === 'environment' ? metadataStats.data : undefined}
                  isLoading={metadataField === 'environment' && metadataStats.isLoading}
                  dateRange={dateRange}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
