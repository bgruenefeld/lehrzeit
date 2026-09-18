import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { By } from '@angular/platform-browser';
import { FormGroupDirective } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { SchoolYearStore } from './core/school-year.store';
import { WorkTimeStore } from './core/work-time.store';
import { isoDate, periodBounds, shiftPeriod, WorkPeriod } from './core/work-date';

registerLocaleData(localeDe);

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('creates the application', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts on the time capture view', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Arbeitszeit erfassen');
  });
  it('shows empty analysis and updates it after capturing time', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const analysisButton = Array.from(
      fixture.nativeElement.querySelectorAll('.sidebar nav button'),
    ).find((button) =>
      (button as HTMLButtonElement).textContent?.includes('Auswertung'),
    ) as HTMLButtonElement;
    analysisButton.click();
    fixture.detectChanges();
    const stats = () => fixture.nativeElement.querySelector('.stat-grid').textContent;
    expect(stats()).toContain('0:00');
    expect(stats()).toContain('0 erfasste Tage');
    const now = new Date();
    TestBed.inject(WorkTimeStore).add({
      category: 'LESSON',
      date: isoDate(now),
      durationMinutes: 45,
      note: '',
    });
    fixture.detectChanges();
    expect(stats()).toContain('0:45');
    expect(stats()).toContain('1 erfasste Tage');
    expect(fixture.nativeElement.querySelector('.donut strong').textContent).toBe('0:45');
  });
  it.each(['capture', 'overview'])('edits an entry from %s', (view) => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(WorkTimeStore);
    const entry = store.add({
      category: 'LESSON',
      date: isoDate(new Date()),
      durationMinutes: 75,
      note: 'Original',
    });
    fixture.detectChanges();
    if (view === 'overview') {
      fixture.nativeElement.querySelectorAll('.sidebar nav button')[1].click();
      fixture.detectChanges();
    }
    fixture.nativeElement.querySelector('[aria-label="Eintrag bearbeiten"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain(
      'Arbeitszeit bearbeiten',
    );
    expect(fixture.nativeElement.querySelector('.mode-switch')).toBeNull();
    const form = fixture.debugElement
      .query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective).form;
    expect(form.value.hours).toBe(1);
    expect(form.value.minutes).toBe(15);
    expect(form.value.note).toBe('Original');
    expect(isoDate(form.value.date)).toBe(entry.date);
    form.patchValue({ hours: 2, minutes: 10, date: new Date(2026, 0, 5), note: ' Geändert ' });
    fixture.nativeElement.querySelectorAll('.category')[1].click();
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(store.entries()).toEqual([
      {
        ...entry,
        category: 'PREPARATION',
        date: '2026-01-05',
        durationMinutes: 130,
        note: 'Geändert',
      },
    ]);
    expect(fixture.nativeElement.querySelector('h1').textContent).not.toContain('bearbeiten');
  });

  it('rejects zero duration and cancels without changing the stored entry', () => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(WorkTimeStore);
    const entry = store.add({
      category: 'LESSON',
      date: isoDate(new Date()),
      durationMinutes: 45,
      note: 'Original',
    });
    fixture.detectChanges();
    const form = fixture.debugElement
      .query(By.directive(FormGroupDirective))
      .injector.get(FormGroupDirective).form;
    form.patchValue({ hours: 3, note: 'Entwurf' });
    fixture.nativeElement.querySelector('[aria-label="Eintrag bearbeiten"]').click();
    fixture.detectChanges();
    form.patchValue({ hours: 0, minutes: 0, note: 'Geändert' });
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(store.entries()).toEqual([entry]);
    expect(fixture.nativeElement.querySelector('.cancel-edit')).not.toBeNull();
    fixture.nativeElement.querySelector('.cancel-edit').click();
    fixture.detectChanges();
    expect(store.entries()).toEqual([entry]);
    expect(form.value.hours).toBe(3);
    expect(form.value.note).toBe('Entwurf');
  });
  it('navigates overview weeks and updates entries, totals and bars', () => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(WorkTimeStore);
    const current = periodBounds(new Date(), 'week').start;
    const previous = shiftPeriod(current, 'week', -1);
    store.add({ category: 'LESSON', date: isoDate(current), durationMinutes: 30, note: 'Aktuell' });
    store.add({
      category: 'OTHER',
      date: isoDate(previous),
      durationMinutes: 90,
      note: 'Vorwoche',
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelectorAll('.sidebar nav button')[1].click();
    fixture.detectChanges();
    const label = () => fixture.nativeElement.querySelector('.period-nav strong').textContent;
    const currentLabel = label();
    expect(fixture.nativeElement.querySelector('.entries-list').textContent).toContain('Aktuell');
    expect(fixture.nativeElement.querySelector('.entries-list').textContent).not.toContain(
      'Vorwoche',
    );
    fixture.nativeElement.querySelector('[aria-label="Vorherige Woche"]').click();
    fixture.detectChanges();
    expect(label()).not.toBe(currentLabel);
    expect(fixture.nativeElement.querySelector('.entries-list').textContent).toContain('Vorwoche');
    expect(fixture.nativeElement.querySelector('.entries-list').textContent).not.toContain(
      'Aktuell',
    );
    expect(fixture.nativeElement.querySelector('.week-summary strong').textContent).toContain(
      '1 Std. 30 Min.',
    );
    expect(fixture.componentInstance['weekDays']().reduce((sum, day) => sum + day.minutes, 0)).toBe(
      90,
    );
    fixture.nativeElement.querySelector('[aria-label="Nächste Woche"]').click();
    fixture.detectChanges();
    expect(label()).toBe(currentLabel);
    fixture.nativeElement.querySelector('[aria-label="Nächste Woche"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.entries-list .empty-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.week-summary strong').textContent).toContain(
      '0 Min.',
    );
  });

  it.each<WorkPeriod>(['day', 'week', 'month'])(
    'navigates analysis %s periods and keeps charts in sync',
    (period) => {
      const fixture = TestBed.createComponent(App);
      const store = TestBed.inject(WorkTimeStore);
      const current = periodBounds(new Date(), period).start;
      const previous = shiftPeriod(current, period, -1);
      store.add({ category: 'LESSON', date: isoDate(current), durationMinutes: 30, note: '' });
      store.add({ category: 'OTHER', date: isoDate(previous), durationMinutes: 90, note: '' });
      fixture.detectChanges();
      fixture.nativeElement.querySelectorAll('.sidebar nav button')[2].click();
      fixture.detectChanges();
      const index = ['day', 'week', 'month'].indexOf(period);
      fixture.nativeElement.querySelectorAll('.period-tabs button')[index].click();
      fixture.detectChanges();
      const label = () => fixture.nativeElement.querySelector('.period-nav strong').textContent;
      const currentLabel = label();
      expect(fixture.nativeElement.querySelector('.donut strong').textContent).toBe('0:30');
      fixture.nativeElement.querySelector('[aria-label="Vorheriger Zeitraum"]').click();
      fixture.detectChanges();
      expect(label()).not.toBe(currentLabel);
      expect(fixture.nativeElement.querySelector('.donut strong').textContent).toBe('1:30');
      expect(
        fixture.componentInstance['analysisBars']().reduce((sum, bar) => sum + bar.minutes, 0),
      ).toBe(90);
      fixture.nativeElement.querySelector('[aria-label="Nächster Zeitraum"]').click();
      fixture.detectChanges();
      expect(label()).toBe(currentLabel);
      expect(fixture.nativeElement.querySelector('.donut strong').textContent).toBe('0:30');
      fixture.nativeElement.querySelector('[aria-label="Nächster Zeitraum"]').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.donut strong').textContent).toBe('0:00');
    },
  );
  it.each<WorkPeriod>(['day', 'week', 'month'])(
    'shows category entries only within the selected %s period',
    (period) => {
      const fixture = TestBed.createComponent(App);
      const store = TestBed.inject(WorkTimeStore);
      const current = periodBounds(new Date(), period).start;
      const previous = shiftPeriod(current, period, -1);
      store.add({
        category: 'LESSON',
        date: isoDate(current),
        durationMinutes: 45,
        note: 'Passender Eintrag',
      });
      store.add({
        category: 'LESSON',
        date: isoDate(previous),
        durationMinutes: 90,
        note: 'Vorheriger Zeitraum',
      });
      store.add({
        category: 'MINUS_HOURS',
        date: isoDate(current),
        durationMinutes: 15,
        note: 'Andere Kategorie',
      });
      fixture.detectChanges();
      fixture.nativeElement.querySelectorAll('.sidebar nav button')[2].click();
      fixture.detectChanges();
      fixture.nativeElement
        .querySelectorAll('.period-tabs button')
        [['day', 'week', 'month'].indexOf(period)].click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#category-entries')).toBeNull();
      fixture.nativeElement
        .querySelector('[aria-label="Unterricht: Zeiteinträge anzeigen"]')
        .click();
      fixture.detectChanges();
      const table = () =>
        fixture.nativeElement.querySelector('#category-entries tbody').textContent;
      expect(table()).toContain('Passender Eintrag');
      expect(table()).not.toContain('Vorheriger Zeitraum');
      expect(table()).not.toContain('Andere Kategorie');
      expect(fixture.nativeElement.querySelector('.category-entry-summary').textContent).toContain(
        '45 Min.',
      );
      fixture.nativeElement.querySelector('[aria-label="Vorheriger Zeitraum"]').click();
      fixture.detectChanges();
      expect(table()).toContain('Vorheriger Zeitraum');
      expect(table()).not.toContain('Passender Eintrag');
      fixture.nativeElement
        .querySelector('[aria-label="Minusstunden: Zeiteinträge anzeigen"]')
        .click();
      fixture.detectChanges();
      expect(table()).toContain('keine Zeiten erfasst');
      fixture.nativeElement.querySelector('[aria-label="Nächster Zeitraum"]').click();
      fixture.detectChanges();
      expect(table()).toContain('Andere Kategorie');
      expect(table()).not.toContain('Passender Eintrag');
      fixture.nativeElement.querySelector('[aria-label="Zeiteinträge ausblenden"]').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('#category-entries')).toBeNull();
    },
  );
  it('creates a school year through settings and reports matching entries including both boundaries', () => {
    const fixture = TestBed.createComponent(App);
    const store = TestBed.inject(WorkTimeStore);
    for (const date of ['2026-09-06', '2026-09-07', '2027-07-23', '2027-07-24']) {
      store.add({ category: 'LESSON', date, durationMinutes: 30, note: date });
    }
    fixture.detectChanges();
    fixture.nativeElement.querySelector('[aria-label="Schuljahre verwalten"]').click();
    fixture.detectChanges();
    const form = fixture.debugElement
      .query(By.css('.school-year-form'))
      .injector.get(FormGroupDirective).form;
    form.setValue({ name: 'Mein Schuljahr', start: '2026-09-07', end: '2027-07-23' });
    fixture.nativeElement
      .querySelector('.school-year-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    expect(TestBed.inject(SchoolYearStore).years()).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.school-year-list').textContent).toContain(
      '07.09.2026',
    );
    fixture.nativeElement.querySelector('[aria-label="Schuljahrverwaltung schließen"]').click();
    fixture.nativeElement.querySelectorAll('.sidebar nav button')[2].click();
    fixture.detectChanges();
    fixture.nativeElement.querySelectorAll('.period-tabs button')[3].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.school-year-selection').textContent).toContain(
      '23.07.2027',
    );
    expect(fixture.nativeElement.querySelector('.donut strong').textContent).toBe('1:00');
    const app = fixture.componentInstance;
    expect(
      app['analysisEntries']()
        .map((entry) => entry.date)
        .sort(),
    ).toEqual(['2026-09-07', '2027-07-23']);
    expect(app['analysisBars']().reduce((sum, bar) => sum + bar.minutes, 0)).toBe(60);
    fixture.nativeElement.querySelector('[aria-label="Unterricht: Zeiteinträge anzeigen"]').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('#category-entries tbody tr')).toHaveLength(2);
    const entry = app['analysisEntries']()[0];
    store.edit(entry.id, {
      category: entry.category,
      date: '2027-07-24',
      durationMinutes: 30,
      note: '',
    });
    fixture.detectChanges();
    expect(app['analysisMinutes']()).toBe(30);
    expect(app['categoryEntries']()).toHaveLength(1);
  });

  it('navigates between configured school years rather than assumed calendar bounds', () => {
    const years = TestBed.inject(SchoolYearStore);
    const first = years.add({ name: 'Erstes', start: '2025-09-15', end: '2026-07-20' });
    const second = years.add({ name: 'Zweites', start: '2026-09-07', end: '2027-07-23' });
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app['selectedSchoolYearId'].set(second.id);
    app['analysisPeriod'].set('schoolYear');
    app['view'].set('analysis');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[aria-label="Nächster Zeitraum"]').disabled).toBe(
      true,
    );
    fixture.nativeElement.querySelector('[aria-label="Vorheriger Zeitraum"]').click();
    fixture.detectChanges();
    expect(app['selectedSchoolYear']()?.id).toBe(first.id);
    expect(fixture.nativeElement.querySelector('[aria-label="Vorheriger Zeitraum"]').disabled).toBe(
      true,
    );
    fixture.nativeElement.querySelector('[aria-label="Nächster Zeitraum"]').click();
    fixture.detectChanges();
    expect(app['selectedSchoolYear']()?.id).toBe(second.id);
  });

  it('shows an empty state without inventing school year dates', () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance['view'].set('analysis');
    fixture.componentInstance['analysisPeriod'].set('schoolYear');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.school-year-selection').textContent).toContain(
      'Lege ein Schuljahr',
    );
    expect(fixture.componentInstance['analysisEntries']()).toEqual([]);
    expect(fixture.componentInstance['analysisBars']()).toEqual([]);
  });
});
