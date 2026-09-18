import { TestBed } from '@angular/core/testing';
import { isoDate } from './work-date';
import { WorkTimeStore } from './work-time.store';

describe('WorkTimeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('starts empty without stored data', () => {
    const store = TestBed.inject(WorkTimeStore);
    expect(store.entries()).toEqual([]);
    expect(store.totalTodayMinutes()).toBe(0);
    expect(store.totalWeekMinutes()).toBe(0);
  });

  it.each(['invalid json', '{}', '[]'])('starts empty for storage value %s', (value) => {
    localStorage.setItem('lehrzeit.entries.v1', value);
    expect(TestBed.inject(WorkTimeStore).entries()).toEqual([]);
  });

  it('removes persisted demo entries while preserving own entries', () => {
    const ownEntry = {
      id: 'own-entry',
      category: 'OTHER',
      date: '2026-09-18',
      durationMinutes: 20,
      note: 'Eigener Eintrag',
      createdAt: '2026-09-18T10:00:00Z',
    };
    localStorage.setItem(
      'lehrzeit.entries.v1',
      JSON.stringify([
        ...['demo-1', 'demo-2', 'demo-3'].map((id) => ({ ...ownEntry, id })),
        ownEntry,
      ]),
    );
    expect(TestBed.inject(WorkTimeStore).entries()).toEqual([ownEntry]);
    expect(JSON.parse(localStorage.getItem('lehrzeit.entries.v1')!)).toEqual([ownEntry]);
  });

  it('adds and persists an entry', () => {
    const store = TestBed.inject(WorkTimeStore);
    const initialCount = store.entries().length;
    store.add({ category: 'LESSON', date: '2026-09-18', durationMinutes: 45, note: 'Test' });
    expect(store.entries()).toHaveLength(initialCount + 1);
    expect(localStorage.getItem('lehrzeit.entries.v1')).toContain('Test');
  });

  it('removes an entry by id', () => {
    const store = TestBed.inject(WorkTimeStore);
    const entry = store.add({
      category: 'OTHER',
      date: '2026-09-18',
      durationMinutes: 15,
      note: '',
    });
    store.remove(entry.id);
    expect(store.entries().some((candidate) => candidate.id === entry.id)).toBe(false);
  });
  it('edits and persists an entry without changing its identity', () => {
    const store = TestBed.inject(WorkTimeStore);
    const entry = store.add({
      category: 'LESSON',
      date: isoDate(new Date()),
      durationMinutes: 45,
      note: '',
    });
    expect(
      store.edit(entry.id, {
        category: 'OTHER',
        date: entry.date,
        durationMinutes: 90,
        note: 'Geändert',
      }),
    ).toBe(true);
    expect(store.entries()).toEqual([
      { ...entry, category: 'OTHER', durationMinutes: 90, note: 'Geändert' },
    ]);
    expect(store.totalTodayMinutes()).toBe(90);
    expect(store.totalWeekMinutes()).toBe(90);
    expect(JSON.parse(localStorage.getItem('lehrzeit.entries.v1')!)).toEqual(store.entries());
    store.edit(entry.id, { category: 'OTHER', date: '2000-01-01', durationMinutes: 90, note: '' });
    expect(store.totalTodayMinutes()).toBe(0);
    expect(store.totalWeekMinutes()).toBe(0);
  });

  it('does not recreate a missing entry when editing', () => {
    const store = TestBed.inject(WorkTimeStore);
    expect(
      store.edit('missing', {
        category: 'OTHER',
        date: '2026-09-18',
        durationMinutes: 30,
        note: '',
      }),
    ).toBe(false);
    expect(store.entries()).toEqual([]);
  });
});
