'use client';

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartSkeleton } from '@/components/shared/ChartSkeleton';
import CustomTooltip from '@/components/charts/CustomTooltip';
import type { ProviderStat } from '@/types';

interface ProviderPieChartProps {
  data: ProviderStat[] | undefined;
  isLoading: boolean;
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10B981',
  anthropic: '#F59E0B',
  google: '#3B82F6',
  cohere: '#8B5CF6',
  replicate: '#EC4899',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

function getColor(provider: string) {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? '#94A3B8';
}

export default function ProviderPieChart({
  data,
  isLoading,
}: ProviderPieChartProps) {
  if (isLoading) {
    return <PieChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Provider Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="spend"
                nameKey="provider"
                outerRadius={100}
                label={({ percent }) => `${Math.round(percent * 100)}%`}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.provider}
                    fill={getColor(entry.provider)}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
