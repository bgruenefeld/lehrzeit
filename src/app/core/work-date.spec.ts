import { isoDate, periodBounds, shiftPeriod } from './work-date';

describe('work date periods', () => {
  it('moves weeks across the year boundary with Monday as the first day', () => {
    const previous = shiftPeriod(new Date(2026, 0, 5), 'week', -1);
    expect(isoDate(previous)).toBe('2025-12-29');
    expect(isoDate(periodBounds(previous, 'week').end)).toBe('2026-01-05');
    expect(isoDate(shiftPeriod(previous, 'week', 1))).toBe('2026-01-05');
  });

  it('does not skip February when navigating from the end of January', () => {
    const next = shiftPeriod(new Date(2024, 0, 31), 'month', 1);
    expect(isoDate(next)).toBe('2024-02-01');
    expect(isoDate(periodBounds(next, 'month').end)).toBe('2024-03-01');
    expect(isoDate(shiftPeriod(new Date(2024, 1, 28), 'day', 1))).toBe('2024-02-29');
  });

  it('uses August through July for school years in either direction', () => {
    const bounds = periodBounds(new Date(2026, 6, 31), 'schoolYear');
    expect(isoDate(bounds.start)).toBe('2025-08-01');
    expect(isoDate(bounds.end)).toBe('2026-08-01');
    expect(isoDate(shiftPeriod(bounds.start, 'schoolYear', 1))).toBe('2026-08-01');
    expect(isoDate(shiftPeriod(bounds.end, 'schoolYear', -1))).toBe('2025-08-01');
  });
});
