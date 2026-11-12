import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../shared/icon';
import { RouterLink } from '@angular/router';
import type { DashboardTask } from './dashboard.models';
import { isDueToday, isOverdue, taskDueLabel } from './task-date';

@Component({
  selector: 'app-summary-tasks',
  imports: [Icon, RouterLink],
  template: `
    <section class="dashboard-panel" aria-labelledby="next-step-title">
      <header class="panel-heading">
        <div>
          <h2 id="next-step-title" #heading tabindex="-1">Tu próximo paso</h2>
          <p>Atiende primero lo que más importa.</p>
        </div>
        @if (filtered().length > 3) {
          <button
            type="button"
            class="inline-link"
            [attr.aria-expanded]="expanded()"
            aria-controls="task-list"
            (click)="expanded.set(!expanded())"
          >
            {{ expanded() ? 'Ver menos' : 'Ver todas' }} <app-icon name="arrow" />
          </button>
        } @else {
          <a class="inline-link" routerLink="/app/maintenance"
            >Ver todas <app-icon name="arrow"
          /></a>
        }
      </header>
      @if (search() || attentionOnly()) {
        <div class="filter-note" role="status">
          <span>{{
            attentionOnly() ? 'Solo tareas prioritarias' : 'Resultados para “' + search() + '”'
          }}</span>
          <button class="text-button" type="button" (click)="cleared.emit()">Limpiar</button>
        </div>
      }
      <ul class="task-list" id="task-list">
        @for (task of shown(); track task.id) {
          <li>
            <button type="button" class="task-row" (click)="selected.emit(task)">
              <span
                class="task-indicator"
                [class.overdue]="overdue(task)"
                [class.high]="!overdue(task) && needsAttention(task)"
              >
                <app-icon [name]="overdue(task) ? 'alert' : 'clock'" />
              </span>
              <span class="task-copy"
                ><strong>{{ task.title }}</strong
                ><span>{{ task.propertyName }}</span></span
              >
              <span
                class="task-due"
                [class.overdue-text]="overdue(task)"
                [class.today]="today(task)"
                >{{ label(task) }}</span
              >
            </button>
          </li>
        } @empty {
          <li class="empty-tasks">
            <app-icon name="check" />
            <p>
              {{
                search() || attentionOnly()
                  ? 'No hay tareas que coincidan con estos filtros.'
                  : 'Sin tareas pendientes. Un buen momento para planificar el próximo cuidado.'
              }}
            </p>
          </li>
        }
      </ul>
      @if (tasks().length === 50) {
        <p class="muted small">
          Se muestran hasta 50 tareas. Usa la búsqueda o el filtro de propiedad para afinar los
          resultados.
        </p>
      }
    </section>
  `,
  styles: `
    .dashboard-panel {
      height: 100%;
      min-height: 19.5rem;
      padding: 1.5rem;
    }
    .task-list {
      padding: 0;
      list-style: none;
      margin: 0.8rem 0 0;
    }
    li + li {
      border-top: 1px solid #edf0e9;
    }
    .task-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.9rem 0;
      width: 100%;
      color: var(--ink);
      text-align: left;
      border: 0;
      background: transparent;
      border-radius: 0.25rem;
    }
    .task-row:hover {
      background: #f7f9f2;
    }
    .task-indicator {
      display: grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      flex-shrink: 0;
      border-radius: 50%;
      background: #f1f3eb;
      color: #5e7253;
    }
    .task-indicator app-icon {
      width: 1rem;
      height: 1rem;
    }
    .task-indicator.overdue {
      background: #faeee8;
      color: #a1432a;
    }
    .task-indicator.high {
      background: #f9f1dc;
      color: #856321;
    }
    .task-copy {
      display: grid;
      gap: 0.3rem;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    .task-copy strong {
      font-size: 0.72rem;
      font-weight: 600;
    }
    .task-copy > span {
      font-size: 0.62rem;
      color: var(--muted);
    }
    .task-due {
      margin-left: auto;
      flex-shrink: 0;
      font-size: 0.6rem;
      color: var(--muted);
      padding: 0.25rem 0.4rem;
      border-radius: 0.2rem;
      background: #f4f6ef;
    }
    .task-due.overdue-text {
      background: #fbede7;
      color: #9b4936;
    }
    .task-due.today {
      background: #f9f1dc;
      color: #856321;
    }
    .filter-note {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 0.7rem;
      background: #f2f5eb;
      padding: 0.3rem 0.6rem;
      margin-top: 0.7rem;
      overflow-wrap: anywhere;
    }
    .filter-note .text-button {
      font-size: 0.65rem;
      flex-shrink: 0;
    }
    .empty-tasks {
      display: grid;
      justify-items: center;
      padding: 2rem 0;
      text-align: center;
      color: #557044;
    }
    .empty-tasks p {
      font-size: 0.72rem;
      color: var(--muted);
      max-width: 22rem;
    }
    @media (max-width: 600px) {
      .task-row {
        flex-wrap: wrap;
        gap: 0.6rem;
      }
      .task-copy {
        flex: 1;
      }
      .task-due {
        margin-left: 2.6rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryTasks {
  readonly tasks = input.required<DashboardTask[]>();
  readonly now = input.required<string>();
  readonly search = input('');
  readonly attentionOnly = input(false);
  readonly selected = output<DashboardTask>();
  readonly cleared = output<void>();
  readonly expanded = signal(false);
  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');
  readonly filtered = computed(() =>
    this.attentionOnly() ? this.tasks().filter((t) => this.needsAttention(t)) : this.tasks(),
  );
  readonly shown = computed(() => this.filtered().slice(0, this.expanded() ? 50 : 3));
  overdue(task: DashboardTask): boolean {
    return isOverdue(task, this.now());
  }
  today(task: DashboardTask): boolean {
    return isDueToday(task, this.now());
  }
  needsAttention(task: DashboardTask): boolean {
    return this.overdue(task) || task.priority === 'high' || task.priority === 'urgent';
  }
  label(task: DashboardTask): string {
    return taskDueLabel(task, this.now());
  }
  focus(): void {
    this.expanded.set(true);
    this.heading().nativeElement.focus();
  }
}
