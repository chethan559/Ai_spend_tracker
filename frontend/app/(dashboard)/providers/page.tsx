'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, Minus, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useProviderDetail } from '@/hooks/useStats';
import ProviderDrawer from '@/components/ProviderDrawer';
import type { ProviderDetail } from '@/types';

/* ── provider display metadata ──────────────────────────────────────────── */

const PROVIDER_META: Record<string, { label: string; color: string; bg: string }> = {
  openai:    { label: 'OpenAI',        color: '#10A37F', bg: '#10A37F1a' },
  anthropic: { label: 'Anthropic',     color: '#D97706', bg: '#D977061a' },
  google:    { label: 'Google Gemini', color: '#4285F4', bg: '#4285F41a' },
  cohere:    { label: 'Cohere',        color: '#8B5CF6', bg: '#8B5CF61a' },
  replicate: { label: 'Replicate',     color: '#6366F1', bg: '#6366F11a' },
};

function getMeta(provider: string) {
  return PROVIDER_META[provider.toLowerCase()] ?? {
    label: provider.charAt(0).toUpperCase() + provider.slice(1),
    color: '#71717a',
    bg: '#71717a1a',
  };
}

/* ── formatters ─────────────────────────────────────────────────────────── */

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(v);

const fmtCurrency4 = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 4,
  }).format(v);

/* ── status badge ───────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: ProviderDetail['status'] }) {
  const cfg = {
    active:  { dot: 'bg-green-500',  label: 'Active',  text: 'text-green-700 dark:text-green-400' },
    idle:    { dot: 'bg-yellow-500', label: 'Idle',    text: 'text-yellow-700 dark:text-yellow-400' },
    no_data: { dot: 'bg-muted-foreground/40', label: 'No data', text: 'text-muted-foreground' },
  }[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full shrink-0', cfg.dot)} />
      <span className={cn('text-sm', cfg.text)}>{cfg.label}</span>
    </div>
  );
}

/* ── MoM change cell ────────────────────────────────────────────────────── */

function MomChange({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const isUp = value > 0;
  const isFlat = Math.abs(value) < 0.1;

  if (isFlat) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3.5 w-3.5" />
        <span className="text-sm tabular-nums">0.0%</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1', isUp ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
      {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      <span className="text-sm font-medium tabular-nums">
        {isUp ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );
}

/* ── skeleton rows ──────────────────────────────────────────────────────── */

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/* ── budget modal ───────────────────────────────────────────────────────── */

interface BudgetModalProps {
  provider: string | null;
  budgets: Record<string, number>;
  onSave: (provider: string, amount: number) => void;
  onClose: () => void;
}

function BudgetModal({ provider, budgets, onSave, onClose }: BudgetModalProps) {
  const [value, setValue] = useState(
    provider ? String(budgets[provider] ?? '') : '',
  );
  const meta = provider ? getMeta(provider) : null;

  const handleSave = () => {
    if (!provider) return;
    const amount = parseFloat(value);
    if (!Number.isFinite(amount) || amount <= 0) return;
    onSave(provider, amount);
    onClose();
  };

  return (
    <Dialog open={Boolean(provider)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Set Budget —{' '}
            <span style={{ color: meta?.color }}>{meta?.label}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Monthly limit (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="100.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-7"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            You'll see a warning in the table when spend exceeds this limit.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={!value || Number(value) <= 0}>
              Save Budget
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── main page ──────────────────────────────────────────────────────────── */

export default function ProvidersPage() {
  const { data, isLoading, error, refetch } = useProviderDetail();
  const [drawerProvider, setDrawerProvider] = useState<ProviderDetail | null>(null);
  const [budgetProvider, setBudgetProvider] = useState<string | null>(null);
  const [budgets, setBudgets] = useState<Record<string, number>>({});

  const handleSaveBudget = (provider: string, amount: number) => {
    setBudgets((prev) => ({ ...prev, [provider]: amount }));
  };

  return (
    <div className="container-custom space-y-8 py-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Compare spend and usage across all AI providers
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch?.()} disabled={isLoading}>
          <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Failed to load provider data. Please try again.
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[140px]">Provider</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="text-right min-w-[110px]">This Month</TableHead>
                  <TableHead className="text-right min-w-[110px]">Last Month</TableHead>
                  <TableHead className="min-w-[110px]">MoM Change</TableHead>
                  <TableHead className="min-w-[130px]">Top Model</TableHead>
                  <TableHead className="text-right min-w-[90px]">Requests</TableHead>
                  <TableHead className="text-right min-w-[130px]">Avg / Request</TableHead>
                  <TableHead className="min-w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows />
                ) : !data || data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="py-12 text-center text-sm text-muted-foreground">
                      No provider data yet. Start logging API calls to see stats here.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((row) => {
                    const meta = getMeta(row.provider);
                    const budget = budgets[row.provider];
                    const overBudget = budget !== undefined && row.thisMonth.cost > budget;

                    return (
                      <TableRow
                        key={row.provider}
                        className={cn(
                          'transition-colors',
                          overBudget && 'bg-red-500/5',
                        )}
                      >
                        {/* Provider */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              {meta.label.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-tight">{meta.label}</p>
                              {budget !== undefined && (
                                <p className={cn('text-xs', overBudget ? 'text-red-500' : 'text-muted-foreground')}>
                                  Budget: {fmtCurrency(budget)}
                                  {overBudget && ' ⚠'}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={row.status} />
                          {row.lastActivity && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {format(parseISO(row.lastActivity), 'MMM d')}
                            </p>
                          )}
                        </TableCell>

                        {/* This month */}
                        <TableCell className="text-right tabular-nums font-medium">
                          {fmtCurrency(row.thisMonth.cost)}
                        </TableCell>

                        {/* Last month */}
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {row.lastMonth.cost > 0 ? fmtCurrency(row.lastMonth.cost) : '—'}
                        </TableCell>

                        {/* MoM change */}
                        <TableCell>
                          <MomChange value={row.momChange} />
                        </TableCell>

                        {/* Top model */}
                        <TableCell className="text-sm">
                          {row.topModel ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Requests */}
                        <TableCell className="text-right tabular-nums">
                          {row.thisMonth.requests > 0
                            ? row.thisMonth.requests.toLocaleString()
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Avg cost */}
                        <TableCell className="text-right tabular-nums">
                          {row.avgCostPerRequest > 0
                            ? fmtCurrency4(row.avgCostPerRequest)
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDrawerProvider(row)}
                            >
                              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                              View Details
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setBudgetProvider(row.provider)}
                              className="text-muted-foreground"
                            >
                              Set Budget
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ProviderDrawer
        provider={drawerProvider}
        onClose={() => setDrawerProvider(null)}
      />

      <BudgetModal
        provider={budgetProvider}
        budgets={budgets}
        onSave={handleSaveBudget}
        onClose={() => setBudgetProvider(null)}
      />
    </div>
  );
}
