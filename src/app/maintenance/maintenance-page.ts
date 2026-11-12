import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  afterRenderEffect,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AuthClient } from '../auth/auth-client';
import { DashboardClient } from '../dashboard/dashboard-client';
import { Icon } from '../shared/icon';
import type { DashboardProperty } from '../dashboard/dashboard.models';
import { MaintenanceClient } from './maintenance-client';
import type {
  MaintenanceActivity,
  MaintenancePlan,
  MaintenanceResponse,
} from './maintenance.models';
import { PlanDialog } from './plan-dialog';
import { CreateDialog } from '../dashboard/create-dialog';
import { MaintenanceCalendar } from './maintenance-calendar';

type PlanState =
  | { status: 'loading' }
  | {
      status: 'ready';
      data: MaintenanceResponse;
      properties: DashboardProperty[];
      propertyId: string;
      month: string;
    }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-maintenance-page',
  imports: [Icon, PlanDialog, CreateDialog, MaintenanceCalendar],
  host: { class: 'workspace-page' },
  templateUrl: './maintenance-page.html',
  styleUrl: './maintenance-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenancePage {
  private readonly api = inject(MaintenanceClient);
  readonly dashboard = inject(DashboardClient);
  private readonly auth = inject(AuthClient);
  readonly propertyId = signal('');
  readonly month = signal(this.currentMonth());
  readonly mode = signal<'list' | 'plans' | 'calendar'>('list');
  readonly selectedDate = signal(this.zonedDate(this.auth.sessions().user?.user.timeZone ?? 'UTC'));
  readonly dayFilter = signal('');
  readonly statusFilter = signal<MaintenanceActivity['status'] | ''>('');
  readonly assigneeFilter = signal('');
  readonly taskTab = signal<'pending' | 'completed'>('pending');
  readonly selectedActivityId = signal('');
  readonly taskDialog = viewChild.required(CreateDialog);
  readonly weekDays = computed(() => {
    const date = new Date(this.selectedDate() + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(date);
      day.setUTCDate(day.getUTCDate() + index);
      const key = day.toISOString().slice(0, 10);
      return {
        key,
        number: day.getUTCDate(),
        label: new Intl.DateTimeFormat('es', { weekday: 'short', timeZone: 'UTC' }).format(day),
      };
    });
  });
  private readonly request = computed(() => ({
    month: this.month(),
    propertyId: this.propertyId(),
    version: this.refreshVersion(),
    months:
      this.mode() === 'list'
        ? [...new Set([this.month(), ...this.weekDays().map((day) => day.key.slice(0, 7))])]
        : [this.month()],
  }));
  readonly refreshVersion = signal(0);
  readonly changing = signal<string | null>(null);
  readonly error = signal('');
  readonly success = signal('');
  readonly createDialog = viewChild.required(PlanDialog);
  private readonly afterRefreshFocus = signal(false);
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('pageHeading');
  readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ month, propertyId, months }) =>
        forkJoin([
          forkJoin(months.map((value) => this.api.plans(value, propertyId))),
          this.dashboard.summary('', ''),
        ]).pipe(
          map(([responses, summary]): PlanState => ({
            status: 'ready',
            data: {
              ...responses[0],
              activities: responses
                .flatMap((response) => response.activities)
                .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.id.localeCompare(b.id)),
            },
            properties: summary.properties,
            propertyId,
            month,
          })),
          catchError((error: unknown) =>
            of<PlanState>({ status: 'error', message: this.api.errorMessage(error) }),
          ),
          startWith<PlanState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies PlanState },
  );
  readonly data = computed(() => {
    const state = this.state();
    return state.status === 'ready' &&
      state.month === this.month() &&
      state.propertyId === this.propertyId()
      ? state
      : null;
  });
  readonly properties = computed(() => this.data()?.properties ?? []);
  readonly plans = computed(() => {
    const search = this.dashboard.search().trim().toLocaleLowerCase();
    return (this.data()?.data.plans ?? []).filter(
      (plan) =>
        (!this.propertyId() || plan.propertyId === this.propertyId()) &&
        (!search ||
          `${plan.title} ${plan.propertyName} ${plan.tasks.map((task) => task.title).join(' ')}`
            .toLocaleLowerCase()
            .includes(search)),
    );
  });
  readonly activities = computed(() => {
    const search = this.dashboard.search().trim().toLocaleLowerCase();
    return (this.data()?.data.activities ?? []).filter(
      (activity) =>
        !search ||
        `${activity.title} ${activity.propertyName} ${activity.planTitle ?? ''}`
          .toLocaleLowerCase()
          .includes(search),
    );
  });
  readonly assignees = computed(() => [
    ...new Map(
      (this.data()?.data.activities ?? [])
        .flatMap((activity) => activity.assignees)
        .map((assignee) => [assignee.id, assignee]),
    ).values(),
  ]);
  readonly weekActivities = computed(() => {
    const keys = new Set(this.weekDays().map((day) => day.key));
    return this.activities().filter(
      (activity) =>
        keys.has(this.activityDate(activity)) &&
        (!this.dayFilter() || this.activityDate(activity) === this.dayFilter()) &&
        (!this.statusFilter() || activity.status === this.statusFilter()) &&
        (!this.assigneeFilter() ||
          activity.assignees.some((assignee) => assignee.id === this.assigneeFilter())),
    );
  });
  readonly pendingActivities = computed(() =>
    this.weekActivities().filter((activity) => activity.status !== 'completed'),
  );
  readonly completedActivities = computed(() =>
    this.weekActivities().filter((activity) => activity.status === 'completed'),
  );
  readonly shownActivities = computed(() =>
    this.taskTab() === 'pending' ? this.pendingActivities() : this.completedActivities(),
  );
  readonly selectedActivity = computed<MaintenanceActivity | null>(
    () =>
      this.shownActivities().find((activity) => activity.id === this.selectedActivityId()) ??
      this.shownActivities()[0] ??
      null,
  );
  readonly selectedPlan = computed(
    () =>
      this.data()?.data.plans.find((plan) => plan.id === this.selectedActivity()?.planId) ?? null,
  );
  readonly writableProperties = computed(() =>
    this.properties().filter((property) => property.canCreateTask),
  );
  readonly canWrite = computed(() => this.writableProperties().length > 0);
  readonly monthLabel = computed(() => {
    const [year, month] = this.month().split('-').map(Number);
    return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
      new Date(Date.UTC(year, month - 1, 1, 12)),
    );
  });
  readonly calendarCells = computed(() => {
    const [year, month] = this.month().split('-').map(Number);
    const first = new Date(Date.UTC(year, month - 1, 1));
    const offset = (first.getUTCDay() + 6) % 7;
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const total = Math.ceil((offset + length) / 7) * 7;
    const activities = this.activities();
    return Array.from({ length: total }, (_, index) => {
      const dayNumber = index - offset + 1;
      const inMonth = dayNumber >= 1 && dayNumber <= length;
      const date = new Date(Date.UTC(year, month - 1, dayNumber, 12));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
      return {
        key: inMonth ? key : '',
        label: date.getUTCDate(),
        inMonth,
        activities: inMonth
          ? activities.filter((activity) => this.activityDate(activity) === key)
          : [],
      };
    });
  });
  readonly todayKey = computed(() =>
    this.zonedDate(this.auth.sessions().user?.user.timeZone ?? 'UTC'),
  );

  constructor() {
    afterRenderEffect(() => {
      if (this.afterRefreshFocus() && this.state().status === 'ready') {
        this.heading()?.nativeElement.focus();
        this.afterRefreshFocus.set(false);
      }
    });
  }
  currentMonth(): string {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: this.auth.sessions().user?.user.timeZone ?? 'UTC',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date());
    return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
  }
  private zonedDate(zone: string, value = new Date()): string {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(value);
    return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
  }
  private activityDate(activity: MaintenanceActivity): string {
    return this.zonedDate(activity.timeZone, new Date(activity.dueAt));
  }
  moveMonth(direction: -1 | 1): void {
    const [year, month] = this.month().split('-').map(Number);
    const next = new Date(Date.UTC(year, month - 1 + direction, 1, 12));
    this.month.set(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  moveWeek(direction: -1 | 1): void {
    const date = new Date(this.selectedDate() + 'T12:00:00Z');
    date.setUTCDate(date.getUTCDate() + direction * 7);
    this.selectedDate.set(date.toISOString().slice(0, 10));
    this.month.set(date.toISOString().slice(0, 7));
    this.dayFilter.set('');
  }
  selectDay(key: string): void {
    this.selectedDate.set(key);
    this.dayFilter.set(key);
  }
  setStatusFilter(value: string): void {
    if (value === '' || value === 'pending' || value === 'in_progress' || value === 'completed') {
      this.statusFilter.set(value);
      this.taskTab.set(value === 'completed' ? 'completed' : 'pending');
    }
  }
  setTaskTab(tab: 'pending' | 'completed'): void {
    const status = this.statusFilter();
    if (
      (tab === 'pending' && status === 'completed') ||
      (tab === 'completed' && status !== '' && status !== 'completed')
    ) {
      this.statusFilter.set('');
    }
    this.taskTab.set(tab);
  }
  clearTaskFilters(): void {
    this.dashboard.search.set('');
    this.dayFilter.set('');
    this.statusFilter.set('');
    this.assigneeFilter.set('');
  }
  assigneeLabel(activity: MaintenanceActivity): string {
    return activity.assignees.map((assignee) => assignee.name).join(', ') || 'Sin asignar';
  }
  dayCount(key: string): number {
    return this.activities().filter((activity) => this.activityDate(activity) === key).length;
  }
  isOverdue(activity: MaintenanceActivity): boolean {
    return activity.status !== 'completed' && new Date(activity.dueAt).getTime() < Date.now();
  }
  activityStatus(activity: MaintenanceActivity): string {
    return activity.status === 'completed'
      ? 'Completada'
      : this.isOverdue(activity)
        ? 'Vencida'
        : activity.status === 'in_progress'
          ? 'En curso'
          : 'Pendiente';
  }
  async complete(activity: MaintenanceActivity): Promise<void> {
    if (this.changing() || !activity.canWrite || activity.status === 'completed') return;
    this.changing.set(activity.id);
    this.error.set('');
    this.success.set('');
    try {
      await this.api.completeActivity(activity.id);
      this.success.set('Tarea completada. Su historial y tus indicadores se han actualizado.');
      this.afterRefreshFocus.set(true);
      this.refresh();
    } catch (error) {
      this.error.set(this.api.errorMessage(error));
    } finally {
      this.changing.set(null);
    }
  }
  taskCreated(): void {
    this.success.set('Tarea creada y guardada correctamente.');
    this.afterRefreshFocus.set(true);
    this.refresh();
  }
  refresh(): void {
    this.refreshVersion.update((version) => version + 1);
  }
  async toggle(plan: MaintenancePlan): Promise<void> {
    if (this.changing()) return;
    this.changing.set(plan.id);
    this.error.set('');
    this.success.set('');
    try {
      await this.api.setPlanStatus(plan.id, plan.status === 'active' ? 'paused' : 'active');
      this.success.set(
        plan.status === 'active' ? 'Plan pausado. No se eliminó su historial.' : 'Plan reactivado.',
      );
      this.refresh();
    } catch (error) {
      this.error.set(this.api.errorMessage(error));
    } finally {
      this.changing.set(null);
    }
  }
  created(): void {
    this.success.set('Plan guardado junto con su primera tarea.');
    this.afterRefreshFocus.set(true);
    this.refresh();
  }
  recurrence(plan: MaintenancePlan): string {
    const units: Record<MaintenancePlan['recurrenceUnit'], [string, string]> = {
      day: ['día', 'días'],
      week: ['semana', 'semanas'],
      month: ['mes', 'meses'],
      year: ['año', 'años'],
    };
    const unit = units[plan.recurrenceUnit][plan.recurrenceInterval === 1 ? 0 : 1];
    return `Cada ${plan.recurrenceInterval} ${unit}`;
  }
  dateLabel(
    value: string,
    zone: string,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' },
  ): string {
    return new Intl.DateTimeFormat('es', { ...options, timeZone: zone }).format(new Date(value));
  }
  priorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return labels[priority] ?? 'Media';
  }
}
