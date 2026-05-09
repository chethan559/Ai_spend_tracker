'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export type MetadataField = 'feature' | 'userId' | 'environment' | 'custom';

interface MetadataFilterBarProps {
  field: MetadataField;
  customKey: string;
  onFieldChange: (field: MetadataField) => void;
  onCustomKeyChange: (key: string) => void;
}

const FIELD_OPTIONS: { value: MetadataField; label: string }[] = [
  { value: 'feature', label: 'Feature' },
  { value: 'userId', label: 'User ID' },
  { value: 'environment', label: 'Environment' },
  { value: 'custom', label: 'Custom Key' },
];

export default function MetadataFilterBar({
  field,
  customKey,
  onFieldChange,
  onCustomKeyChange,
}: MetadataFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        Break down by:
      </span>
      <Select value={field} onValueChange={(v) => onFieldChange(v as MetadataField)}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FIELD_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {field === 'custom' && (
        <Input
          placeholder="e.g. department"
          value={customKey}
          onChange={(e) => onCustomKeyChange(e.target.value)}
          className="w-48"
        />
      )}
    </div>
  );
}
