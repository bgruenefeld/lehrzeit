export function isoDate(date: Date): string {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function weekStart(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export type WorkPeriod = 'day' | 'week' | 'month' | 'schoolYear';

export function periodBounds(date: Date, period: WorkPeriod): { start: Date; end: Date } {
  let start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  switch (period) {
    case 'week':
      start = weekStart(date);
      break;
    case 'month':
      start.setDate(1);
      break;
    // Schuljahr: 1. August bis einschließlich 31. Juli.
    case 'schoolYear':
      start = new Date(date.getFullYear() - (date.getMonth() < 7 ? 1 : 0), 7, 1);
      break;
  }
  const end = new Date(start);
  switch (period) {
    case 'day':
      end.setDate(end.getDate() + 1);
      break;
    case 'week':
      end.setDate(end.getDate() + 7);
      break;
    case 'month':
      end.setMonth(end.getMonth() + 1);
      break;
    case 'schoolYear':
      end.setFullYear(end.getFullYear() + 1);
      break;
  }
  return { start, end };
}

export function shiftPeriod(date: Date, period: WorkPeriod, direction: number): Date {
  const { start } = periodBounds(date, period);
  switch (period) {
    case 'day':
      start.setDate(start.getDate() + direction);
      break;
    case 'week':
      start.setDate(start.getDate() + direction * 7);
      break;
    case 'month':
      start.setMonth(start.getMonth() + direction);
      break;
    case 'schoolYear':
      start.setFullYear(start.getFullYear() + direction);
      break;
  }
  return start;
}
