'use client';

import { useEffect, useRef, useState } from 'react';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { ApiLog } from '@/types';

const FEED_STYLE = `
@keyframes slideInRow {
  from { opacity: 0; transform: translateY(-5px); }
  to   { opacity: 1; transform: translateY(0); }
}
.row-new { animation: slideInRow 0.4s ease forwards; }
`;

const PROVIDER_COLORS: Record<string, string> = {
  openai:    '#10A37F',
  anthropic: '#D97706',
  google:    '#4285F4',
  cohere:    '#8B5CF6',
  replicate: '#6366F1',
};

function providerColor(p: string) {
  return PROVIDER_COLORS[p.toLowerCase()] ?? '#71717a';
}

const fmtCost = (v: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 6,
  }).format(v);

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

interface LiveEventFeedProps {
  logs: ApiLog[] | undefined;
  isLoading: boolean;
  lastUpdated: number;
}

export default function LiveEventFeed({ logs, isLoading, lastUpdated }: LiveEventFeedProps) {
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const currentIds = new Set(logs.map((l) => l.id));
    const fresh = new Set<string>();
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id) && prevIdsRef.current.size > 0) {
        fresh.add(id);
      }
    }
    prevIdsRef.current = currentIds;

    if (fresh.size === 0) return;
    setNewIds(fresh);
    const t = setTimeout(() => setNewIds(new Set()), 500);
    return () => clearTimeout(t);
  }, [logs]);

  const relativeUpdate = lastUpdated
    ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })
    : null;

  return (
    <>
      <style>{FEED_STYLE}</style>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">Live Event Feed</CardTitle>
          <div className="flex items-center gap-3">
            {relativeUpdate && (
              <span className="text-xs text-muted-foreground">
                Updated {relativeUpdate}
              </span>
            )}
            <div className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[90px]">Time</TableHead>
                  <TableHead className="min-w-[100px]">Provider</TableHead>
                  <TableHead className="min-w-[110px]">Feature</TableHead>
                  <TableHead className="min-w-[140px]">Model</TableHead>
                  <TableHead className="text-right min-w-[80px]">Tokens</TableHead>
                  <TableHead className="text-right min-w-[90px]">Cost</TableHead>
                  <TableHead className="min-w-[120px]">User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows />
                ) : !logs || logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No events yet
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const isNew = newIds.has(log.id);
                    const color = providerColor(log.provider);
                    const feature = (log.metadata as Record<string, string> | undefined)?.feature;
                    const userId = (log.metadata as Record<string, string> | undefined)?.userId;

                    return (
                      <TableRow
                        key={log.id}
                        className={cn('transition-colors', isNew && 'row-new')}
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {format(parseISO(log.timestamp), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <span
                            className="rounded px-1.5 py-0.5 text-xs font-medium"
                            style={{ background: `${color}1a`, color }}
                          >
                            {log.provider}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {feature ? (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                              {feature}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.model}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {log.tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          {fmtCost(log.cost)}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {userId ?? '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
