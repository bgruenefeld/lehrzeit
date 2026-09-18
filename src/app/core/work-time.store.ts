import { Injectable, computed, signal } from '@angular/core';
import { NewWorkEntry, WorkEntry } from './work-entry.model';
import { isoDate, weekStart } from './work-date';

const STORAGE_KEY = 'lehrzeit.entries.v1';
@Injectable({ providedIn: 'root' })
export class WorkTimeStore {
  private readonly state = signal<readonly WorkEntry[]>(this.load());
  readonly entries = this.state.asReadonly();
  readonly todayEntries = computed(() =>
    this.entries().filter((entry) => entry.date === isoDate(new Date())),
  );
  readonly totalTodayMinutes = computed(() =>
    this.todayEntries().reduce((sum, entry) => sum + entry.durationMinutes, 0),
  );
  readonly weekEntries = computed(() => {
    const start = weekStart(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return this.entries().filter(
      (entry) => entry.date >= isoDate(start) && entry.date < isoDate(end),
    );
  });
  readonly totalWeekMinutes = computed(() =>
    this.weekEntries().reduce((sum, entry) => sum + entry.durationMinutes, 0),
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

  edit(id: string, changes: NewWorkEntry): boolean {
    if (!this.entries().some((entry) => entry.id === id)) return false;
    this.update(
      this.entries().map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    );
    return true;
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
    if (!value) return [];
    try {
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed)) return [];
      const entries = (parsed as WorkEntry[]).filter(
        (entry) => !['demo-1', 'demo-2', 'demo-3'].includes(entry.id),
      );
      if (entries.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      }
      return entries;
    } catch {
      return [];
    }
  }
}
