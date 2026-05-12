'use client';

import { useMemo, useState } from 'react';
import { subDays } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import StatsOverview from '@/components/dashboard/StatsOverview';
import DateRangePicker from '@/components/dashboard/DateRangePicker';
import DailySpendChart from '@/components/charts/DailySpendChart';
import ProviderPieChart from '@/components/charts/ProviderPieChart';
import ModelBarChart from '@/components/charts/ModelBarChart';
import MetadataFilterBar, { type MetadataField } from '@/components/MetadataFilterBar';
import FeatureBreakdownTable from '@/components/FeatureBreakdownTable';
import UserCostTable from '@/components/UserCostTable';
import ActivationGuide from '@/components/shared/ActivationGuide';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useDailyStats,
  useModelBreakdown,
  useOverviewStats,
  useProviderBreakdown,
  useTotalSpend,
} from '@/hooks/useStats';
import { useMetadataStats } from '@/hooks/useMetadataStats';

export default function OverviewPage() {
  const [dateRange, setDateRange] = useState(() => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  }));

  const [metadataField, setMetadataField] = useState<MetadataField>('feature');
  const [customKey, setCustomKey] = useState('');
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  const effectiveField = metadataField !== 'custom' ? metadataField : customKey;

  const overviewStats = useOverviewStats(dateRange.from, dateRange.to);
  const totalSpendStats = useTotalSpend(dateRange.from, dateRange.to);
  const dailyStats = useDailyStats(30);
  const providerStats = useProviderBreakdown(dateRange.from, dateRange.to);
  const modelStats = useModelBreakdown(dateRange.from, dateRange.to);
  const metadataStats = useMetadataStats(effectiveField, dateRange);

  const isRefreshing =
    overviewStats.isLoading ||
    totalSpendStats.isLoading ||
    dailyStats.isLoading ||
    providerStats.isLoading ||
    modelStats.isLoading;

  const hasData = useMemo(() => {
    const overviewHasSpend = (overviewStats.data?.totalSpend ?? 0) > 0;
    const dailyHasData = (dailyStats.data?.length ?? 0) > 0;
    const providerHasData = (providerStats.data?.length ?? 0) > 0;
    const modelHasData = (modelStats.data?.length ?? 0) > 0;

    return overviewHasSpend || dailyHasData || providerHasData || modelHasData;
  }, [overviewStats.data, dailyStats.data, providerStats.data, modelStats.data]);

  const hasErrors = Boolean(
    overviewStats.error ||
      dailyStats.error ||
      providerStats.error ||
      modelStats.error,
  );

  const handleRefresh = async () => {
    try {
      await Promise.all([
        overviewStats.refetch?.(),
        totalSpendStats.refetch?.(),
        dailyStats.refetch?.(),
        providerStats.refetch?.(),
        modelStats.refetch?.(),
        metadataStats.refetch?.(),
      ]);
      toast.success('Dashboard refreshed');
    } catch {
      toast.error('Failed to refresh dashboard');
    }
  };

  const handleFieldChange = (field: MetadataField) => {
    setMetadataField(field);
    if (field !== 'custom') setCustomKey('');
  };

  return (
    <div className="container-custom space-y-8 py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Track your AI API spending and usage
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={(from, to) => from && to && setDateRange({ from, to })}
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={
                isRefreshing ? 'mr-2 h-4 w-4 animate-spin' : 'mr-2 h-4 w-4'
              }
            />
            Refresh
          </Button>
        </div>
      </div>

      {!hasData && !isRefreshing && !hasErrors ? (
        <ActivationGuide />
      ) : (
        <>
          {overviewStats.error ? (
            <ErrorMessage
              message="Failed to load overview stats"
              onRetry={overviewStats.refetch}
            />
          ) : (
            <StatsOverview
              data={overviewStats.data}
              isLoading={overviewStats.isLoading}
              totalSpend={totalSpendStats.data}
              totalSpendLoading={totalSpendStats.isLoading}
              activeProvider={activeProvider}
              onProviderFilter={setActiveProvider}
            />
          )}

          {/* Metadata filter bar — below StatsOverview, controls the analytics section */}
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Select a dimension to break down costs in the analytics section below.
            </p>
            <MetadataFilterBar
              field={metadataField}
              customKey={customKey}
              onFieldChange={handleFieldChange}
              onCustomKeyChange={setCustomKey}
            />
          </div>

          <div className="grid gap-6">
            {dailyStats.error ? (
              <ErrorMessage
                message="Failed to load daily spend data"
                onRetry={dailyStats.refetch}
              />
            ) : (
              <DailySpendChart
                data={dailyStats.data}
                isLoading={dailyStats.isLoading}
              />
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {providerStats.error ? (
                <ErrorMessage
                  message="Failed to load provider breakdown"
                  onRetry={providerStats.refetch}
                />
              ) : (
                <ProviderPieChart
                  data={providerStats.data}
                  isLoading={providerStats.isLoading}
                />
              )}
              {modelStats.error ? (
                <ErrorMessage
                  message="Failed to load model breakdown"
                  onRetry={modelStats.refetch}
                />
              ) : (
                <ModelBarChart
                  data={modelStats.data}
                  isLoading={modelStats.isLoading}
                />
              )}
            </div>
          </div>

          {/* Metadata Analytics — tabbed section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Metadata Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Break down cost and usage by metadata dimensions
              </p>
            </div>

            <Tabs
              value={metadataField}
              onValueChange={(v) => handleFieldChange(v as MetadataField)}
            >
              <TabsList>
                <TabsTrigger value="feature">By Feature</TabsTrigger>
                <TabsTrigger value="userId">By User</TabsTrigger>
                <TabsTrigger value="environment">By Environment</TabsTrigger>
                {metadataField === 'custom' && customKey && (
                  <TabsTrigger value="custom">By {customKey}</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="feature" className="mt-4">
                {metadataStats.error && metadataField === 'feature' ? (
                  <ErrorMessage
                    message="Failed to load feature breakdown"
                    onRetry={metadataStats.refetch}
                  />
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
                  <ErrorMessage
                    message="Failed to load user breakdown"
                    onRetry={metadataStats.refetch}
                  />
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
                  <ErrorMessage
                    message="Failed to load environment breakdown"
                    onRetry={metadataStats.refetch}
                  />
                ) : (
                  <FeatureBreakdownTable
                    field="environment"
                    data={metadataField === 'environment' ? metadataStats.data : undefined}
                    isLoading={metadataField === 'environment' && metadataStats.isLoading}
                    dateRange={dateRange}
                  />
                )}
              </TabsContent>

              {metadataField === 'custom' && customKey && (
                <TabsContent value="custom" className="mt-4">
                  {metadataStats.error ? (
                    <ErrorMessage
                      message={`Failed to load ${customKey} breakdown`}
                      onRetry={metadataStats.refetch}
                    />
                  ) : (
                    <FeatureBreakdownTable
                      field={customKey}
                      data={metadataStats.data}
                      isLoading={metadataStats.isLoading}
                      dateRange={dateRange}
                    />
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
}
