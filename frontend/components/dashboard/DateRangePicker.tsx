'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subDays, subMonths } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  from?: Date;
  to?: Date;
  onSelect: (from: Date | undefined, to: Date | undefined) => void;
}

const formatRange = (from?: Date, to?: Date) => {
  if (from && to) {
    return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`;
  }

  if (from) {
    return format(from, 'MMM d, yyyy');
  }

  return 'Pick a date';
};

export default function DateRangePicker({
  from,
  to,
  onSelect,
}: DateRangePickerProps) {
  const [tempFrom, setTempFrom] = useState<Date | undefined>(from);
  const [tempTo, setTempTo] = useState<Date | undefined>(to);
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (rangeFrom: Date, rangeTo: Date) => {
    onSelect(rangeFrom, rangeTo);
    setTempFrom(rangeFrom);
    setTempTo(rangeTo);
    setIsOpen(false);
  };

  const handleApply = () => {
    onSelect(tempFrom, tempTo);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempFrom(undefined);
    setTempTo(undefined);
    onSelect(undefined, undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-start gap-2 text-left font-normal', !from && 'text-muted-foreground')}
        >
          <CalendarIcon className="h-4 w-4" />
          {formatRange(from, to)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col gap-4 p-4 md:flex-row">
          <div className="flex w-full flex-col gap-2 md:w-40">
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handlePreset(subDays(new Date(), 6), new Date())}
            >
              Last 7 days
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handlePreset(subDays(new Date(), 29), new Date())}
            >
              Last 30 days
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => handlePreset(subDays(new Date(), 89), new Date())}
            >
              Last 90 days
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                const start = startOfMonth(new Date());
                const end = endOfMonth(new Date());
                handlePreset(start, end);
              }}
            >
              This month
            </Button>
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                const lastMonth = subMonths(new Date(), 1);
                handlePreset(startOfMonth(lastMonth), endOfMonth(lastMonth));
              }}
            >
              Last month
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            <Calendar
              mode="range"
              selected={{ from: tempFrom, to: tempTo }}
              onSelect={(range) => {
                setTempFrom(range?.from);
                setTempTo(range?.to);
              }}
              numberOfMonths={2}
              defaultMonth={tempFrom ?? new Date()}
              initialFocus
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              {(tempFrom || tempTo) && (
                <Button variant="ghost" onClick={handleClear}>
                  Clear
                </Button>
              )}
              <Button onClick={handleApply}>Apply</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
