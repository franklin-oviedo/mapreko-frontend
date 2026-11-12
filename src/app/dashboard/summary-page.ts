import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { AuthClient } from '../auth/auth-client';
import { Icon } from '../shared/icon';
import { CreateDialog } from './create-dialog';
import { DashboardClient } from './dashboard-client';
import type { DashboardState, DashboardTask } from './dashboard.models';
import { SummaryMetrics } from './summary-metrics';
import { SummaryTasks } from './summary-tasks';
import { PropertyHealth } from './property-health';
import { isOverdue, taskDueLabel } from './task-date';

@Component({
  selector: 'app-summary-page',
  imports: [RouterLink, Icon, CreateDialog, SummaryMetrics, SummaryTasks, PropertyHealth],
  host: { class: 'workspace-page' },
  templateUrl: './summary-page.html',
  styleUrl: './summary-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryPage {
  readonly client = inject(DashboardClient);
  private readonly auth = inject(AuthClient);
  private readonly refreshVersion = signal(0);
  readonly propertyId = signal('');
  readonly attentionOnly = signal(false);
  readonly success = signal('');
  readonly details = signal<DashboardTask | null>(null);
  readonly createDialog = viewChild.required(CreateDialog);
  private readonly detailDialog = viewChild.required<ElementRef<HTMLDialogElement>>('detailDialog');
  private readonly detailHeading =
    viewChild.required<ElementRef<HTMLHeadingElement>>('detailHeading');
  private readonly taskList = viewChild(SummaryTasks);
  private readonly newTaskButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('newTaskButton');
  private readonly focusAfterLoad = signal<'tasks' | 'new-task' | null>(null);
  private readonly query = computed(() => ({
    propertyId: this.propertyId(),
    search: this.client.search().trim(),
    version: this.refreshVersion(),
  }));
  readonly state = toSignal(
    toObservable(this.query).pipe(
      debounceTime(200),
      switchMap((query) =>
        this.client.summary(query.propertyId, query.search).pipe(
          map((data): DashboardState => ({ status: 'ready', data, query })),
          catchError((error: unknown) =>
            of<DashboardState>({ status: 'error', message: this.client.errorMessage(error) }),
          ),
          startWith<DashboardState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies DashboardState },
  );
  readonly summary = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data : null;
  });
  readonly properties = computed(() => this.summary()?.properties ?? []);
  readonly writableProperties = computed(() => this.properties().filter((p) => p.canCreateTask));
  readonly canCreateProperty = computed(
    () =>
      this.auth.sessions().user?.workspaces.some((w) => w.role === 'owner' || w.role === 'admin') ??
      false,
  );
  readonly name = computed(() => {
    const user = this.auth.sessions().user?.user;
    return (user?.displayName || user?.givenName || 'bienvenido').split(' ')[0];
  });
  readonly date = computed(() => {
    const summary = this.summary();
    return summary
      ? new Intl.DateTimeFormat('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: summary.timeZone,
        }).format(new Date(summary.generatedAt))
      : '';
  });
  readonly month = computed(() => {
    const summary = this.summary();
    return summary
      ? new Intl.DateTimeFormat('es', {
          month: 'long',
          year: 'numeric',
          timeZone: summary.timeZone,
        }).format(new Date(summary.generatedAt))
      : '';
  });
  constructor() {
    afterRenderEffect(() => {
      const target = this.focusAfterLoad();
      const state = this.state();
      const query = this.query();
      if (
        !target ||
        state.status !== 'ready' ||
        state.query.version !== query.version ||
        state.query.propertyId !== query.propertyId ||
        state.query.search !== query.search
      )
        return;
      if (target === 'tasks') this.taskList()?.focus();
      else this.newTaskButton().nativeElement.focus();
      this.focusAfterLoad.set(null);
    });
  }

  refresh(): void {
    this.refreshVersion.update((version) => version + 1);
  }
  resetFilters(): void {
    this.propertyId.set('');
    this.client.search.set('');
    this.attentionOnly.set(false);
    this.refresh();
  }
  created(event: { kind: 'task' | 'property'; propertyId: string }): void {
    this.propertyId.set(event.propertyId);
    this.client.search.set('');
    this.attentionOnly.set(false);
    this.success.set(
      event.kind === 'task'
        ? 'Tarea creada y guardada correctamente.'
        : 'Propiedad registrada correctamente. Ya puedes crear su primera tarea.',
    );
    this.focusAfterLoad.set(event.kind === 'property' ? 'new-task' : 'tasks');
    this.refresh();
  }
  review(): void {
    this.client.search.set('');
    this.attentionOnly.set(true);
    this.focusAfterLoad.set('tasks');
  }
  clearTaskFilters(): void {
    this.client.search.set('');
    this.attentionOnly.set(false);
  }
  isOverdue(task: DashboardTask): boolean {
    return isOverdue(task, this.summary()?.generatedAt ?? task.dueAt);
  }
  dueLabel(task: DashboardTask): string {
    return taskDueLabel(task, this.summary()?.generatedAt ?? task.dueAt);
  }
  openTask(task: DashboardTask): void {
    this.details.set(task);
    this.detailDialog().nativeElement.showModal();
    this.detailHeading().nativeElement.focus();
  }
  closeTask(): void {
    this.detailDialog().nativeElement.close();
  }
}
