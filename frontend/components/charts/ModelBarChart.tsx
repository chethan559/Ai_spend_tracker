'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartSkeleton } from '@/components/shared/ChartSkeleton';
import CustomTooltip from '@/components/charts/CustomTooltip';
import type { ModelStat } from '@/types';

interface ModelBarChartProps {
  data: ModelStat[] | undefined;
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

const formatModelLabel = (value: string) =>
  value.length > 20 ? `${value.slice(0, 18)}...` : value;

function getColor(provider: string) {
  return PROVIDER_COLORS[provider.toLowerCase()] ?? '#94A3B8';
}

export default function ModelBarChart({
  data,
  isLoading,
}: ModelBarChartProps) {
  if (isLoading) {
    return <BarChartSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Models by Spend</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  const topModels = [...data]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Models by Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topModels}
              layout="vertical"
              margin={{ top: 10, right: 16, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tickFormatter={(value) => formatCurrency(Number(value))}
                axisLine={false}
                tickLine={false}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                type="category"
                dataKey="model"
                tickFormatter={formatModelLabel}
                axisLine={false}
                tickLine={false}
                width={120}
                className="text-xs text-muted-foreground"
              />
              <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
              <Bar dataKey="spend" radius={[4, 4, 4, 4]}>
                {topModels.map((entry) => (
                  <Cell key={entry.model} fill={getColor(entry.provider)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
