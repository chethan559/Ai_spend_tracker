import type { LucideIcon } from 'lucide-react';
import { FileX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  title = 'No data yet',
  description = 'Start tracking your AI API costs by making API calls',
  icon: Icon = FileX,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Icon className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-lg font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action ? (
          <Button onClick={action.onClick}>{action.label}</Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
