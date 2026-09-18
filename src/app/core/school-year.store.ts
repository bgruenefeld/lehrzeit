import { Injectable, signal } from '@angular/core';

export interface SchoolYear {
  readonly id: string;
  readonly name: string;
  readonly start: string;
  readonly end: string;
}

type NewSchoolYear = Omit<SchoolYear, 'id'>;
const STORAGE_KEY = 'lehrzeit.school-years.v1';

@Injectable({ providedIn: 'root' })
export class SchoolYearStore {
  private readonly state = signal<readonly SchoolYear[]>(this.load());
  readonly years = this.state.asReadonly();

  add(value: NewSchoolYear): SchoolYear {
    const year = { ...value, name: value.name.trim(), id: crypto.randomUUID() };
    if (
      !year.name ||
      year.name.length > 80 ||
      !this.validDate(year.start) ||
      !this.validDate(year.end)
    ) {
      throw new Error('Bitte einen Namen und gültige Datumswerte eingeben.');
    }
    if (year.start > year.end)
      throw new Error('Das Enddatum darf nicht vor dem Startdatum liegen.');
    if (this.years().some((item) => year.start <= item.end && year.end >= item.start)) {
      throw new Error('Der Zeitraum überschneidet sich mit einem bestehenden Schuljahr.');
    }
    const years = [...this.years(), year].sort((a, b) => a.start.localeCompare(b.start));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(years));
    this.state.set(years);
    return year;
  }

  private validDate(value: string): boolean {
    const parsed = new Date(`${value}T12:00:00Z`);
    return (
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }

  private load(): readonly SchoolYear[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (!Array.isArray(value)) return [];
      return value
        .filter(
          (item): item is SchoolYear =>
            item &&
            typeof item.id === 'string' &&
            typeof item.name === 'string' &&
            typeof item.start === 'string' &&
            typeof item.end === 'string' &&
            this.validDate(item.start) &&
            this.validDate(item.end) &&
            item.start <= item.end,
        )
        .sort((a, b) => a.start.localeCompare(b.start));
    } catch {
      return [];
    }
  }
}
