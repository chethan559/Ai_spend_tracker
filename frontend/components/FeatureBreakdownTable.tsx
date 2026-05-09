'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFeatureLogs, useFeatureSparkline } from '@/hooks/useMetadataStats';
import type { MetadataStat } from '@/types';

interface FeatureBreakdownTableProps {
  field: string;
  data: MetadataStat[] | undefined;
  isLoading: boolean;
  dateRange: { from: Date; to: Date };
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(value);

function getPctColor(pct: number): string {
  if (pct > 40) return 'bg-red-500';
  if (pct > 20) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getFieldLabel(field: string): string {
  if (field === 'userId') return 'User ID';
  return field.charAt(0).toUpperCase() + field.slice(1);
}

function FeatureSparkline({ field, value }: { field: string; value: string }) {
  const { dailyData, isLoading } = useFeatureSparkline(field, value);

  if (isLoading) {
    return <div className="h-8 w-20 animate-pulse rounded bg-muted" />;
  }
  if (!dailyData.length) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dailyData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.15}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpandedRowContent({
  field,
  value,
  dateRange,
}: {
  field: string;
  value: string;
  dateRange: { from: Date; to: Date };
}) {
  const { dailyData, isLoading } = useFeatureLogs(field, value, dateRange);

  return (
    <div className="border-t border-border bg-muted/20 px-6 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Daily cost — {value}
      </p>
      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : !dailyData.length ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No log data available for the selected period
        </p>
      ) : (
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => format(new Date(v), 'MMM d')}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                className="text-xs text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                axisLine={false}
                tickLine={false}
                width={48}
                tick={{ fontSize: 10 }}
                className="text-xs text-muted-foreground"
              />
              <Tooltip
                formatter={((v: number | undefined) => [formatCurrency(v ?? 0), 'Cost']) as any}
                labelFormatter={(l) => format(new Date(l), 'MMM d, yyyy')}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="spend"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-4" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function EmptyTableState({ field }: { field: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <Code2 className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1">
        <p className="text-sm font-medium">No data yet</p>
        <p className="text-sm text-muted-foreground">
          Make sure you&apos;re passing a{' '}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            {field}
          </code>{' '}
          tag in your SDK calls.
        </p>
      </div>
      <pre className="w-full max-w-sm overflow-x-auto rounded-lg bg-muted p-4 text-left font-mono text-xs">
        {`tracker.openai.chat({\n  messages: [...],\n  metadata: {\n    ${field}: 'my-${field}'\n  }\n})`}
      </pre>
    </div>
  );
}

export default function FeatureBreakdownTable({
  field,
  data,
  isLoading,
  dateRange,
}: FeatureBreakdownTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const sorted = [...(data ?? [])].sort((a, b) => b.totalCost - a.totalCost);
  const totalSpend = sorted.reduce((sum, row) => sum + row.totalCost, 0);
  const fieldLabel = getFieldLabel(field);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{fieldLabel} Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>{fieldLabel}</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Avg/Request</TableHead>
                <TableHead className="w-36">% of Total</TableHead>
                <TableHead className="w-24 text-center">7d Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows />
              ) : !sorted.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyTableState field={field} />
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row) => {
                  const pct = totalSpend > 0 ? (row.totalCost / totalSpend) * 100 : 0;
                  const isExpanded = expandedRow === row.value;

                  return (
                    <Fragment key={row.value}>
                      <TableRow
                        className={cn(
                          'cursor-pointer transition-colors',
                          isExpanded && 'bg-muted/30',
                        )}
                        onClick={() => setExpandedRow(isExpanded ? null : row.value)}
                      >
                        <TableCell className="text-muted-foreground">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.value}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.totalCost)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.requestCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.avgCost)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  getPctColor(pct),
                                )}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <FeatureSparkline field={field} value={row.value} />
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <ExpandedRowContent
                              field={field}
                              value={row.value}
                              dateRange={dateRange}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
