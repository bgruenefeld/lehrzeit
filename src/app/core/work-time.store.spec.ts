import { TestBed } from '@angular/core/testing';
import { WorkTimeStore } from './work-time.store';

describe('WorkTimeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
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
});
