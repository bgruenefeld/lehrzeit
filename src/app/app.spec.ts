import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { WorkTimeStore } from './core/work-time.store';
import { isoDate } from './core/work-date';

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
});
