'use client';

import { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import type { ProviderDetail } from '@/types';

const PROVIDER_META: Record<string, { label: string; color: string; bg: string }> = {
  openai:    { label: 'OpenAI',         color: '#10A37F', bg: '#10A37F1a' },
  anthropic: { label: 'Anthropic',      color: '#D97706', bg: '#D977061a' },
  google:    { label: 'Google Gemini',  color: '#4285F4', bg: '#4285F41a' },
  cohere:    { label: 'Cohere',         color: '#8B5CF6', bg: '#8B5CF61a' },
  replicate: { label: 'Replicate',      color: '#6366F1', bg: '#6366F11a' },
};

function getMeta(provider: string) {
  return PROVIDER_META[provider.toLowerCase()] ?? {
    label: provider.charAt(0).toUpperCase() + provider.slice(1),
    color: '#71717a',
    bg: '#71717a1a',
  };
}

const fmt = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(v);

const fmt2 = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(v);

interface ProviderDrawerProps {
  provider: ProviderDetail | null;
  onClose: () => void;
}

export default function ProviderDrawer({ provider, onClose }: ProviderDrawerProps) {
  const isOpen = provider !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const meta = provider ? getMeta(provider.provider) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out sm:w-[480px]',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {!provider ? null : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ background: meta!.bg, color: meta!.color }}
                >
                  {meta!.label.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{meta!.label}</p>
                  <p className="text-xs text-muted-foreground capitalize">{provider.status}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* Key stats row */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'This Month', value: fmt2(provider.thisMonth.cost) },
                  { label: 'Last Month', value: fmt2(provider.lastMonth.cost) },
                  { label: 'Requests', value: provider.thisMonth.requests.toLocaleString() },
                  { label: 'Avg / Request', value: fmt(provider.avgCostPerRequest) },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
                  </div>
                ))}
              </div>

              {/* 30-day spend chart */}
              <div>
                <p className="mb-3 text-sm font-medium">Daily Spend — Last 30 Days</p>
                {provider.daily.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
                    No data for this period
                  </div>
                ) : (
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={provider.daily} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(v) => format(parseISO(v), 'MMM d')}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
                          axisLine={false}
                          tickLine={false}
                          width={52}
                          tick={{ fontSize: 10 }}
                        />
                        <Tooltip
                          formatter={(v: number | undefined) => [fmt2(v ?? 0), 'Spend']}
                          labelFormatter={(l) => format(parseISO(l as string), 'MMM d, yyyy')}
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
                          stroke={meta!.color}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Top 3 models */}
              {provider.topModels.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium">Top Models This Month</p>
                  <div className="space-y-2">
                    {provider.topModels.map((m, i) => {
                      const total = provider.topModels.reduce((s, x) => s + x.cost, 0);
                      const pct = total > 0 ? (m.cost / total) * 100 : 0;
                      return (
                        <div key={m.model} className="flex items-center gap-3">
                          <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium">{m.model}</span>
                              <span className="shrink-0 text-sm tabular-nums">{fmt2(m.cost)}</span>
                            </div>
                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: meta!.color }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Insights */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Insights</p>
                <div className="rounded-lg border border-border divide-y divide-border">
                  {provider.peakDay && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Most expensive day</span>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {format(parseISO(provider.peakDay.date), 'MMM d')}
                        </span>
                        <span className="ml-2 text-sm tabular-nums text-muted-foreground">
                          {fmt2(provider.peakDay.cost)}
                        </span>
                      </div>
                    </div>
                  )}
                  {provider.projectedMonthCost !== null && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Projected month-end cost</span>
                      <span className="text-sm font-medium tabular-nums">
                        {fmt2(provider.projectedMonthCost)}
                      </span>
                    </div>
                  )}
                  {provider.lastActivity && (
                    <div className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-muted-foreground">Last request</span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(provider.lastActivity), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
