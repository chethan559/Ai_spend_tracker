import {
  endOfDay,
  endOfMonth,
  parseISO,
  startOfDay,
  startOfMonth,
  subDays,
  format,
} from 'date-fns';

/**
 * Parse a date string from query params, falling back to a default.
 * Example: parseQueryDate('2024-01-19', new Date()).
 */
export function parseQueryDate(
  dateString: string | undefined,
  defaultDate: Date,
): Date {
  if (!dateString) {
    return defaultDate;
  }

  const parsed = parseISO(dateString);
  return Number.isNaN(parsed.getTime()) ? defaultDate : parsed;
}

/**
 * Get the start and end of the current month.
 */
export function getCurrentMonthRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  return {
    startDate: startOfMonth(now),
    endDate: endOfMonth(now),
  };
}

/**
 * Resolve a date range from query strings, defaulting to current month.
 * Ensures endDate is not before startDate.
 */
export function getDateRange(
  startDate?: string,
  endDate?: string,
): { startDate: Date; endDate: Date } {
  const defaults = getCurrentMonthRange();
  const rangeStart = parseQueryDate(startDate, defaults.startDate);
  const rangeEnd = parseQueryDate(endDate, defaults.endDate);

  if (rangeEnd < rangeStart) {
    return { startDate: rangeEnd, endDate: rangeStart };
  }

  return { startDate: rangeStart, endDate: rangeEnd };
}

/**
 * Get start/end Date objects for a rolling N-day window ending "today" in the
 * given timezone. Useful for building date-range query params from the browser.
 */
export function getDateRangeInTimezone(
  days: number,
  timezone = 'UTC',
): { start: Date; end: Date } {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayInTz = formatter.format(now); // e.g. "2026-05-11"

  const endDate = new Date(`${todayInTz}T23:59:59`);

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return { start: startDate, end: endDate };
}

/**
 * Fill missing dates in sparse datasets for charting.
 * Example: fillMissingDates(rows, start, end, 'date', ['spend', 'requests']).
 */
export function fillMissingDates<T extends Record<string, unknown>>(
  data: T[],
  startDate: Date,
  endDate: Date,
  dateKey: string,
  fillKeys: string[],
): Array<T & { [key: string]: unknown }> {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);

  const map = new Map<string, T>();
  for (const item of data) {
    const value = item[dateKey];
    const dateValue =
      value instanceof Date ? value : parseISO(String(value));
    if (!Number.isNaN(dateValue.getTime())) {
      map.set(format(dateValue, 'yyyy-MM-dd'), item);
    }
  }

  const results: Array<T & { [key: string]: unknown }> = [];
  for (let cursor = start; cursor <= end; cursor = subDays(cursor, -1)) {
    const key = format(cursor, 'yyyy-MM-dd');
    const existing = map.get(key);
    if (existing) {
      results.push(existing);
      continue;
    }

    const filled: Record<string, unknown> = { [dateKey]: key };
    for (const fillKey of fillKeys) {
      filled[fillKey] = 0;
    }
    results.push(filled as T & { [key: string]: unknown });
  }

  return results;
}

