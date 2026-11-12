import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../shared/icon';
import type { MaintenanceActivity } from './maintenance.models';

export interface CalendarDay {
  key: string;
  label: number;
  inMonth: boolean;
  activities: MaintenanceActivity[];
}

@Component({
  selector: 'app-maintenance-calendar',
  imports: [Icon],
  template: `
    <section class="content-panel" aria-labelledby="calendar-title">
      <header>
        <div>
          <h2 id="calendar-title">Tu calendario preventivo</h2>
          <p>Fechas límite y tareas programadas de tus propiedades.</p>
        </div>
        <div class="month-controls">
          <button type="button" aria-label="Mes anterior" (click)="moved.emit(-1)">
            <app-icon name="chevron" />
          </button>
          <strong>{{ monthLabel() }}</strong>
          <button type="button" aria-label="Mes siguiente" (click)="moved.emit(1)">
            <app-icon name="chevron" />
          </button>
          <button type="button" (click)="moved.emit(0)">Hoy</button>
        </div>
      </header>
      <div class="calendar" aria-label="Calendario de tareas">
        <div class="weekdays" aria-hidden="true">
          @for (day of ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']; track day) {
            <span>{{ day }}</span>
          }
        </div>
        <div class="calendar-cells">
          @for (cell of cells(); track $index) {
            <div
              class="calendar-cell"
              [class.outside]="!cell.inMonth"
              [class.today]="cell.key === today()"
            >
              <span class="day-number">{{ cell.label }}</span>
              @for (activity of cell.activities.slice(0, 2); track activity.id) {
                <span
                  class="calendar-event"
                  [class.completed]="activity.status === 'completed'"
                  [class.high]="activity.priority === 'high' || activity.priority === 'urgent'"
                  [title]="activity.title + ' · ' + activity.propertyName"
                  >{{ activity.title }}</span
                >
              }
              @if (cell.activities.length > 2) {
                <span class="more-events">+{{ cell.activities.length - 2 }} más</span>
              }
            </div>
          }
        </div>
      </div>
      <ul class="calendar-agenda">
        @for (activity of activities(); track activity.id) {
          <li>
            <span class="agenda-date">{{ dateLabel(activity) }}</span>
            <span class="agenda-copy"
              ><strong>{{ activity.title }}</strong
              ><small
                >{{ activity.propertyName
                }}{{ activity.planTitle ? ' · ' + activity.planTitle : '' }}</small
              ></span
            >
            <span class="agenda-status">{{
              activity.status === 'completed'
                ? 'Completada'
                : activity.status === 'in_progress'
                  ? 'En curso'
                  : 'Pendiente'
            }}</span>
          </li>
        } @empty {
          <li>No hay tareas programadas para {{ monthLabel() }}.</li>
        }
      </ul>
    </section>
  `,
  styleUrl: './maintenance-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceCalendar {
  readonly cells = input.required<CalendarDay[]>();
  readonly activities = input.required<MaintenanceActivity[]>();
  readonly monthLabel = input.required<string>();
  readonly today = input.required<string>();
  readonly moved = output<-1 | 0 | 1>();

  dateLabel(activity: MaintenanceActivity): string {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      timeZone: activity.timeZone,
    }).format(new Date(activity.dueAt));
  }
}
