'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
}

const strengthLabels = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'] as const;

function getStrengthScore(password: string): number {
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }

  if (/[0-9]/.test(password)) {
    score += 1;
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  }

  return score;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password.length) {
    return null;
  }

  const score = getStrengthScore(password);
  const label = strengthLabels[score];
  const progress = (score / 4) * 100;

  const colorClass =
    score <= 1
      ? 'bg-red-500'
      : score === 2
        ? 'bg-yellow-500'
        : score === 3
          ? 'bg-blue-500'
          : 'bg-green-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span
          className={cn(
            'font-medium',
            score <= 1 && 'text-red-500',
            score === 2 && 'text-yellow-600',
            score === 3 && 'text-blue-500',
            score === 4 && 'text-green-500',
          )}
        >
          {label}
        </span>
      </div>
      <Progress value={progress} className={cn('h-2', colorClass)} />
    </div>
  );
}
