import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-[300px] w-full" />;
}
