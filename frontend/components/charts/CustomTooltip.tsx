interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string }>;
  label?: string;
  formatter?: (value: number) => string;
}

export default function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: CustomTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-sm">
      {label ? (
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
      ) : null}
      <div className="mt-2 space-y-1 text-xs">
        {payload.map((entry) => {
          const value = typeof entry.value === 'number' ? entry.value : Number(entry.value);
          const displayValue = formatter ? formatter(value) : value;
          return (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium text-foreground">{displayValue}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
