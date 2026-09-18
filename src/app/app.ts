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
    hours: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.min(0), Validators.max(16)],
    }),
    minutes: new FormControl(30, {
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
      date: this.toIsoDate(value.date),
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

  protected periodLabel(): string {
    return {
      day: this.todayLabel,
      week: '14.–20. September 2026',
      month: 'September 2026',
      schoolYear: 'Schuljahr 2026 / 27',
    }[this.analysisPeriod()];
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private stopTimer(): void {
    if (this.timerHandle) clearInterval(this.timerHandle);
    this.timerHandle = undefined;
    this.timerRunning.set(false);
  }

  private toIsoDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }

  private formatClock(seconds: number): string {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const rest = String(seconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${rest}`;
  }
}
