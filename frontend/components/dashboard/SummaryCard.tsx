import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  isLoading?: boolean;
}

export default function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  isLoading = false,
}: SummaryCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: '#111113', border: '1px solid #1c1c1f' }}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium" style={{ color: '#71717a' }}>
          {title}
        </p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: 'rgba(249,115,22,0.10)' }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: '#f97316' }} />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-24" style={{ background: '#1c1c1f' }} />
            <Skeleton className="h-3.5 w-32" style={{ background: '#1c1c1f' }} />
          </div>
        ) : (
          <>
            <div
              className="text-2xl font-bold tabular-nums sm:text-3xl"
              style={{ letterSpacing: '-0.02em', color: '#ffffff' }}
            >
              {value}
            </div>
            {description && (
              <p className="mt-1 text-sm" style={{ color: '#71717a' }}>
                {description}
              </p>
            )}
            {trend && (
              <p
                className="mt-1 text-sm font-medium"
                style={{ color: trend.isPositive ? '#10b981' : '#ef4444' }}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
