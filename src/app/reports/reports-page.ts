import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { DashboardClient } from '../dashboard/dashboard-client';
import type { DashboardSummary } from '../dashboard/dashboard.models';
import { Icon } from '../shared/icon';

type ReportsState =
  | { status: 'loading' }
  | { status: 'ready'; data: DashboardSummary; propertyId: string }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-reports-page',
  host: { class: 'workspace-page' },
  imports: [Icon, RouterLink],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  readonly client = inject(DashboardClient);
  readonly propertyId = signal('');
  readonly refreshVersion = signal(0);
  private readonly request = computed(() => ({
    propertyId: this.propertyId(),
    version: this.refreshVersion(),
  }));
  readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap(({ propertyId }) =>
        this.client.summary(propertyId, '').pipe(
          map((data): ReportsState => ({ status: 'ready', data, propertyId })),
          catchError((error: unknown) =>
            of<ReportsState>({ status: 'error', message: this.client.errorMessage(error) }),
          ),
          startWith<ReportsState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies ReportsState },
  );
  readonly summary = computed(() => {
    const state = this.state();
    return state.status === 'ready' && state.propertyId === this.propertyId() ? state.data : null;
  });
  readonly monthLabel = computed(() => {
    const data = this.summary();
    return data
      ? new Intl.DateTimeFormat('es', {
          month: 'long',
          year: 'numeric',
          timeZone: data.timeZone,
        }).format(new Date(data.generatedAt))
      : '';
  });
  readonly propertyRows = computed(() => {
    const data = this.summary();
    if (!data) return [];
    const query = this.client.search().trim().toLocaleLowerCase();
    return data.properties.filter(
      (property) =>
        (!this.propertyId() || property.id === this.propertyId()) &&
        (!query || property.name.toLocaleLowerCase().includes(query)),
    );
  });
  readonly taskCompletion = computed(() => {
    const metrics = this.summary()?.metrics;
    return metrics?.monthlyTasks
      ? Math.round((100 * metrics.completedMonthly) / metrics.monthlyTasks)
      : null;
  });
  readonly outstandingTasks = computed(() => {
    const metrics = this.summary()?.metrics;
    return metrics ? Math.max(metrics.monthlyTasks - metrics.completedMonthly, 0) : 0;
  });

  refresh(): void {
    this.refreshVersion.update((version) => version + 1);
  }
  compliance(property: DashboardSummary['properties'][number]): number | null {
    return property.preventiveTotal
      ? Math.round((100 * property.preventiveCompleted) / property.preventiveTotal)
      : null;
  }
  dateLabel(value: string, timeZone: string): string {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone,
    }).format(new Date(value));
  }
}
