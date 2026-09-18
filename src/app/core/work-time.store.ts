import { Injectable, computed, signal } from '@angular/core';
import { NewWorkEntry, WorkEntry } from './work-entry.model';

const STORAGE_KEY = 'lehrzeit.entries.v1';
const DEMO_DATE = new Date().toISOString().slice(0, 10);
const DEMO_ENTRIES: readonly WorkEntry[] = [
  {
    id: 'demo-1',
    category: 'LESSON',
    date: DEMO_DATE,
    durationMinutes: 195,
    note: 'Klassen 7a, 8b, 10a',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    category: 'PREPARATION',
    date: DEMO_DATE,
    durationMinutes: 90,
    note: 'Korrektur Klassenarbeit 8b',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    category: 'CONFERENCE',
    date: DEMO_DATE,
    durationMinutes: 90,
    note: 'Fachkonferenz Biologie',
    createdAt: new Date().toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class WorkTimeStore {
  private readonly state = signal<readonly WorkEntry[]>(this.load());
  readonly entries = this.state.asReadonly();
  readonly todayEntries = computed(() =>
    this.entries().filter((entry) => entry.date === DEMO_DATE),
  );
  readonly totalTodayMinutes = computed(() =>
    this.todayEntries().reduce((sum, entry) => sum + entry.durationMinutes, 0),
  );
  readonly totalWeekMinutes = computed(() =>
    this.entries().reduce((sum, entry) => sum + entry.durationMinutes, 0),
  );

  add(entry: NewWorkEntry): WorkEntry {
    const created: WorkEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.update([created, ...this.entries()]);
    return created;
  }

  remove(id: string): void {
    this.update(this.entries().filter((entry) => entry.id !== id));
  }

  clear(): void {
    this.update([]);
  }

  private update(entries: readonly WorkEntry[]): void {
    this.state.set(entries);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  private load(): readonly WorkEntry[] {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return DEMO_ENTRIES;
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as WorkEntry[]) : DEMO_ENTRIES;
    } catch {
      return DEMO_ENTRIES;
    }
  }
}
