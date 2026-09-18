import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from '@openng/optimus-ui/api';
import { Button } from '@openng/optimus-ui/button';
import { DatePicker } from '@openng/optimus-ui/datepicker';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import { ProgressBar } from '@openng/optimus-ui/progressbar';
import { Textarea } from '@openng/optimus-ui/textarea';
import { Toast } from '@openng/optimus-ui/toast';
import { CATEGORY_META, WorkCategory, WorkEntry } from './core/work-entry.model';
import { WorkTimeStore } from './core/work-time.store';

import { isoDate, weekStart } from './core/work-date';

type View = 'capture' | 'overview' | 'analysis';
type EntryMode = 'manual' | 'timer';
type AnalysisPeriod = 'day' | 'week' | 'month' | 'schoolYear';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    DatePipe,
    ReactiveFormsModule,
    Button,
    DatePicker,
    InputNumber,
    ProgressBar,
    Textarea,
    Toast,
  ],
  providers: [MessageService],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnDestroy {
  private readonly store = inject(WorkTimeStore);
  private readonly messages = inject(MessageService);
  private timerHandle?: ReturnType<typeof setInterval>;

  protected readonly categories = CATEGORY_META;
  protected readonly todayLabel = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  protected readonly view = signal<View>('capture');
  protected readonly entryMode = signal<EntryMode>('manual');
  protected readonly selectedCategory = signal<WorkCategory>('LESSON');
  protected readonly timerSeconds = signal(0);
  protected readonly timerRunning = signal(false);
  protected readonly analysisPeriod = signal<AnalysisPeriod>('week');
  protected readonly entries = this.store.entries;
  protected readonly todayEntries = this.store.todayEntries;
  protected readonly totalTodayMinutes = this.store.totalTodayMinutes;
  protected readonly totalWeekMinutes = this.store.totalWeekMinutes;
  protected readonly weekProgress = computed(() =>
    Math.min(100, Math.round((this.totalWeekMinutes() / (40 * 60)) * 100)),
  );
  protected readonly todayProgress = computed(() =>
    Math.min(100, Math.round((this.totalTodayMinutes() / (8 * 60)) * 100)),
  );
  protected readonly timerLabel = computed(() => this.formatClock(this.timerSeconds()));
  protected readonly pageTitle = computed(
    () =>
      ({
        capture: 'Arbeitszeit erfassen',
        overview: 'Wochenübersicht',
        analysis: 'Auswertung',
      })[this.view()],
  );

  protected readonly form = new FormGroup({
    date: new FormControl(new Date(), { nonNullable: true, validators: [Validators.required] }),
    hours: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(16)],
    }),
    minutes: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(59)],
    }),
    note: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(240)] }),
  });

  protected setView(view: View): void {
    this.view.set(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected selectCategory(category: WorkCategory): void {
    this.selectedCategory.set(category);
  }

  protected setDuration(totalMinutes: number): void {
    this.form.patchValue({ hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 });
  }

  protected toggleTimer(): void {
    if (this.timerRunning()) {
      this.stopTimer();
      return;
    }
    this.timerRunning.set(true);
    this.timerHandle = setInterval(() => this.timerSeconds.update((seconds) => seconds + 1), 1000);
  }

  protected saveEntry(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const durationMinutes =
      this.entryMode() === 'timer'
        ? Math.max(1, Math.ceil(this.timerSeconds() / 60))
        : value.hours * 60 + value.minutes;

    if (durationMinutes < 1) {
      this.messages.add({
        severity: 'warn',
        summary: 'Dauer fehlt',
        detail: 'Bitte mindestens eine Minute erfassen.',
      });
      return;
    }

    this.store.add({
      category: this.selectedCategory(),
      date: isoDate(value.date),
      durationMinutes,
      note: value.note.trim(),
    });
    this.messages.add({
      severity: 'success',
      summary: 'Gespeichert',
      detail: 'Die Arbeitszeit wurde erfasst.',
    });
    this.form.controls.note.reset('');
    if (this.entryMode() === 'timer') {
      this.stopTimer();
      this.timerSeconds.set(0);
    }
  }

  protected removeEntry(entry: WorkEntry): void {
    this.store.remove(entry.id);
    this.messages.add({
      severity: 'info',
      summary: 'Eintrag entfernt',
      detail: 'Die Arbeitszeit wurde gelöscht.',
    });
  }

  protected formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (!hours) return `${rest} Min.`;
    return rest ? `${hours} Std. ${rest} Min.` : `${hours} Std.`;
  }

  protected category(category: WorkCategory) {
    return this.categories.find((item) => item.id === category)!;
  }

  protected readonly weekLabel = this.dateRangeLabel(weekStart(new Date()), 6);
  // Schuljahre werden hier vom 1. August bis zum 31. Juli zusammengefasst.
  private readonly schoolYearStart = new Date().getFullYear() - (new Date().getMonth() < 7 ? 1 : 0);
  protected readonly schoolYearLabel = `${this.schoolYearStart} / ${String(this.schoolYearStart + 1).slice(-2)}`;
  protected readonly analysisEntries = computed(() => {
    const now = new Date();
    switch (this.analysisPeriod()) {
      case 'day':
        return this.todayEntries();
      case 'week':
        return this.store.weekEntries();
      case 'month':
        return this.store
          .entries()
          .filter((entry) => entry.date.slice(0, 7) === isoDate(now).slice(0, 7));
      case 'schoolYear':
        return this.store
          .entries()
          .filter(
            (entry) =>
              entry.date >= `${this.schoolYearStart}-08-01` &&
              entry.date < `${this.schoolYearStart + 1}-08-01`,
          );
    }
  });
  protected readonly analysisMinutes = computed(() =>
    this.analysisEntries().reduce((sum, entry) => sum + entry.durationMinutes, 0),
  );
  protected readonly recordedDays = computed(
    () => new Set(this.analysisEntries().map((entry) => entry.date)).size,
  );
  protected readonly averageMinutes = computed(() =>
    this.recordedDays() ? Math.round(this.analysisMinutes() / this.recordedDays()) : 0,
  );
  protected readonly categoryTotals = computed(() =>
    this.categories.map((category) => {
      const minutes = this.analysisEntries()
        .filter((entry) => entry.category === category.id)
        .reduce((sum, entry) => sum + entry.durationMinutes, 0);
      return {
        ...category,
        minutes,
        share: this.analysisMinutes() ? (minutes / this.analysisMinutes()) * 100 : 0,
      };
    }),
  );
  protected readonly lessonTotal = computed(() => this.categoryTotals()[0]);
  protected readonly donutGradient = computed(() => {
    let position = 0;
    const stops = this.categoryTotals().map((item) => {
      const start = position;
      position += item.share;
      return `${item.color} ${start}% ${position}%`;
    });
    return this.analysisMinutes() ? `conic-gradient(${stops.join(', ')})` : '#e7ecef';
  });
  protected readonly weekDays = computed(() =>
    Array.from({ length: 7 }, (_, index) => {
      const date = weekStart(new Date());
      date.setDate(date.getDate() + index);
      const minutes = this.entries()
        .filter((entry) => entry.date === isoDate(date))
        .reduce((sum, entry) => sum + entry.durationMinutes, 0);
      return {
        date: isoDate(date),
        label: new Intl.DateTimeFormat('de-DE', { weekday: 'short' }).format(date),
        minutes,
        height: Math.min(100, (minutes / (8 * 60)) * 100),
        today: isoDate(date) === isoDate(new Date()),
      };
    }),
  );

  protected hoursLabel(minutes: number): string {
    return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`;
  }

  protected periodLabel(): string {
    return {
      day: this.todayLabel,
      week: this.weekLabel,
      month: new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' }).format(
        new Date(),
      ),
      schoolYear: `Schuljahr ${this.schoolYearLabel}`,
    }[this.analysisPeriod()];
  }

  private dateRangeLabel(start: Date, days: number): string {
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const formatter = new Intl.DateTimeFormat('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.formatRange(start, end);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.timerHandle = undefined;
    this.timerRunning.set(false);
  }

  private formatClock(seconds: number): string {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const rest = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${rest}`;
  }
}
