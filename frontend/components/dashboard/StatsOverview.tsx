'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { StatsOverview as StatsType } from '@/types';

interface StatsOverviewProps {
  data: StatsType | undefined;
  isLoading: boolean;
}

const fmt$ = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(v);

const fmtN = (v: number) => new Intl.NumberFormat('en-US').format(v);

export default function StatsOverview({ data, isLoading }: StatsOverviewProps) {
  const [active, setActive] = useState(0);

  const totalSpend = data?.totalSpend ?? 0;
  const totalRequests = data?.totalRequests ?? 0;
  const avgCost = data?.avgCost ?? 0;
  const costPer1k = totalRequests > 0 ? (totalSpend / totalRequests) * 1000 : 0;

  const stats = [
    { label: 'Total Spend',       value: fmt$(totalSpend),   raw: totalSpend },
    { label: 'Total Requests',    value: fmtN(totalRequests), raw: totalRequests },
    { label: 'Avg Cost / Req',    value: fmt$(avgCost),       raw: avgCost },
    { label: 'Cost / 1K Requests', value: fmt$(costPer1k),   raw: costPer1k },
  ];

  return (
    <div
      style={{
        display: 'flex',
        borderBottom: '1px solid #1c1c1f',
        background: '#0a0a0b',
        overflowX: 'auto',
      }}
    >
      {stats.map((stat, i) => {
        const isActive = active === i;
        return (
          <button
            key={stat.label}
            onClick={() => setActive(i)}
            style={{
              flex: '1 1 0',
              minWidth: 140,
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 6,
              background: 'none',
              border: 'none',
              borderRight: i < stats.length - 1 ? '1px solid #1c1c1f' : 'none',
              borderBottom: isActive ? '2px solid #f97316' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: isActive ? '#f97316' : 'transparent',
                  border: `1.5px solid ${isActive ? '#f97316' : '#3f3f46'}`,
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: isActive ? '#a1a1aa' : '#52525b',
                  fontWeight: 500,
                  transition: 'color 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {stat.label}
              </span>
            </div>
            {isLoading ? (
              <Skeleton style={{ height: 24, width: 80, background: '#1c1c1f', borderRadius: 4 }} />
            ) : (
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: isActive ? '#ffffff' : '#71717a',
                  letterSpacing: '-0.03em',
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  transition: 'color 0.15s',
                }}
              >
                {stat.value}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
