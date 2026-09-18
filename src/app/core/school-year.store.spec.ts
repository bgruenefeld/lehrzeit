import { TestBed } from '@angular/core/testing';
import { SchoolYearStore } from './school-year.store';

describe('SchoolYearStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('persists custom school years and restores them chronologically', () => {
    const store = TestBed.inject(SchoolYearStore);
    const next = store.add({ name: '2027 / 28', start: '2027-09-06', end: '2028-07-21' });
    const first = store.add({ name: ' 2026 / 27 ', start: '2026-09-07', end: '2027-07-23' });
    expect(first.name).toBe('2026 / 27');
    TestBed.resetTestingModule();
    expect(TestBed.inject(SchoolYearStore).years()).toEqual([first, next]);
  });

  it('rejects overlapping dates including shared endpoints', () => {
    const store = TestBed.inject(SchoolYearStore);
    store.add({ name: '2026 / 27', start: '2026-09-07', end: '2027-07-23' });
    expect(() => store.add({ name: 'Overlap', start: '2027-07-23', end: '2028-07-01' })).toThrow(
      'überschneidet',
    );
    expect(() => store.add({ name: 'Contained', start: '2026-10-01', end: '2026-11-01' })).toThrow(
      'überschneidet',
    );
    expect(store.years()).toHaveLength(1);
  });

  it.each([
    { name: '', start: '2026-09-01', end: '2027-07-01' },
    { name: 'Invalid', start: '2026-02-30', end: '2027-07-01' },
    { name: 'Reversed', start: '2027-09-01', end: '2026-07-01' },
  ])('rejects invalid year %s', (value) => {
    expect(() => TestBed.inject(SchoolYearStore).add(value)).toThrow();
    expect(TestBed.inject(SchoolYearStore).years()).toEqual([]);
  });
});
