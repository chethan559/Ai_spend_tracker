'use client';

import { useMemo } from 'react';
import { formatDistanceToNow, parseISO, startOfDay } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveFeed, useOverviewStats } from '@/hooks/useStats';
import LiveEventFeed from '@/components/LiveEventFeed';
import SetupWizard from '@/components/SetupWizard';
import type { ApiLog } from '@/types';

/* ── what we capture checklist ──────────────────────────────────────────── */

const CAPTURED_ITEMS = [
  { label: 'Token counts (input + output)',       captured: true  },
  { label: 'Cost per request (real-time pricing)', captured: true  },
  { label: 'Model used',                           captured: true  },
  { label: 'Timestamp',                            captured: true  },
  { label: 'Feature tag (from your metadata)',     captured: true  },
  { label: 'User ID (from your metadata)',         captured: true  },
  { label: 'Environment (dev / staging / prod)',   captured: true  },
  { label: 'Response latency',                     captured: true  },
  { label: 'Provider invoice total (requires manual API key read access)', captured: false },
];

/* ── provider colours ───────────────────────────────────────────────────── */

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  openai:    { label: 'OpenAI',        color: '#10A37F' },
  anthropic: { label: 'Anthropic',     color: '#D97706' },
  google:    { label: 'Google Gemini', color: '#4285F4' },
  cohere:    { label: 'Cohere',        color: '#8B5CF6' },
  replicate: { label: 'Replicate',     color: '#6366F1' },
};

/* ── status card ─────────────────────────────────────────────────────────── */

interface StatusCardProps {
  logs: ApiLog[] | undefined;
  todayCount: number | undefined;
  isLoading: boolean;
}

function StatusCard({ logs, todayCount, isLoading }: StatusCardProps) {
  const latestLog = logs?.[0];

  const lastSeen = useMemo(() => {
    if (!latestLog) return null;
    try {
      return formatDistanceToNow(parseISO(latestLog.timestamp), { addSuffix: true });
    } catch {
      return null;
    }
  }, [latestLog]);

  const activeProviders = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((l) => l.provider.toLowerCase()))];
  }, [logs]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left — live stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Integration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Row label="Last event received">
                {lastSeen ? (
                  <span className="font-medium text-green-600 dark:text-green-400">{lastSeen}</span>
                ) : (
                  <span className="text-muted-foreground">No events yet</span>
                )}
              </Row>

              <Row label="Events today">
                <span className="font-medium tabular-nums">
                  {todayCount !== undefined ? todayCount.toLocaleString() : '—'}
                </span>
              </Row>

              <Row label="Auto-tracked providers">
                <div className="flex flex-wrap gap-1.5">
                  {activeProviders.length === 0 ? (
                    <span className="text-muted-foreground">None yet</span>
                  ) : (
                    activeProviders.map((p) => {
                      const meta = PROVIDER_META[p] ?? {
                        label: p.charAt(0).toUpperCase() + p.slice(1),
                        color: '#71717a',
                      };
                      return (
                        <span
                          key={p}
                          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: `${meta.color}1a`, color: meta.color }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          {meta.label}
                        </span>
                      );
                    })
                  )}
                </div>
              </Row>

              <Row label="SDK version">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  @ai-spend/tracker v1.0.0
                </code>
              </Row>
            </>
          )}
        </CardContent>
      </Card>

      {/* Right — capture checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What we capture automatically</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {CAPTURED_ITEMS.map(({ label, captured }) => (
              <li key={label} className="flex items-center gap-2.5">
                {captured ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
                <span
                  className={
                    captured ? 'text-sm' : 'text-sm text-muted-foreground line-through'
                  }
                >
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function IntegrationPage() {
  const today = startOfDay(new Date());
  const now = new Date();

  const { data: todayStats } = useOverviewStats(today, now);
  const { data: logsData, isLoading, dataUpdatedAt } = useLiveFeed();

  const logs = logsData?.logs;
  const hasLogs = (logs?.length ?? 0) > 0;

  if (!isLoading && !hasLogs) {
    return <SetupWizard isWaiting />;
  }

  return (
    <div className="container-custom space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-semibold">Integration</h1>
        <p className="text-sm text-muted-foreground">
          Real-time capture status and event feed
        </p>
      </div>

      <StatusCard
        logs={logs}
        todayCount={todayStats?.totalRequests}
        isLoading={isLoading}
      />

      <LiveEventFeed
        logs={logs}
        isLoading={isLoading}
        lastUpdated={dataUpdatedAt}
      />
    </div>
  );
}
