import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { DashboardProperty } from './dashboard.models';

@Component({
  selector: 'app-property-health',
  template: `
    <section class="dashboard-panel" aria-labelledby="property-health-title">
      <header class="panel-heading">
        <div>
          <h2 id="property-health-title">Tus propiedades, al día</h2>
          <p>Cumplimiento del plan preventivo</p>
        </div>
      </header>
      <ul>
        @for (property of shown(); track property.id) {
          <li>
            <button class="property-name" type="button" (click)="selected.emit(property.id)">
              <span>{{ property.name }}</span>
              <span class="property-value">
                @if (property.preventiveTotal) {
                  <strong>{{ compliance(property) }}%</strong>
                }
              </span>
            </button>
            @if (property.preventiveTotal) {
              <div class="progress-row">
                <progress
                  [value]="compliance(property)"
                  [class.low-compliance]="compliance(property) < 70"
                  max="100"
                  [attr.aria-label]="'Cumplimiento preventivo de ' + property.name"
                ></progress>
              </div>
            } @else {
              <p class="no-plan">Sin tareas preventivas este mes</p>
            }
          </li>
        } @empty {
          <li class="muted small">
            {{
              search()
                ? 'No hay propiedades que coincidan con la búsqueda.'
                : 'Aquí verás cómo avanzan tus propiedades.'
            }}
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .dashboard-panel {
      height: 100%;
      min-height: 19.5rem;
      padding: 1.5rem;
    }
    ul {
      padding: 0;
      list-style: none;
      margin: 0.8rem 0 0;
    }
    li {
      padding: 0.7rem 0;
    }
    li + li {
      border-top: 1px solid #edf0e9;
    }
    .property-name {
      display: flex;
      justify-content: space-between;
      gap: 0.7rem;
      align-items: center;
      width: 100%;
      text-align: left;
      border: 0;
      background: none;
      padding: 0.25rem 0;
      min-height: 1.8rem;
      color: var(--ink);
      font-size: 0.72rem;
      font-weight: 550;
      overflow-wrap: anywhere;
    }
    .property-name:hover {
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }
    .property-value {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    .progress-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.65rem;
    }
    progress {
      display: block;
      appearance: none;
      border: 0;
      height: 0.35rem;
      border-radius: 1rem;
      background: #edf0e6;
      width: 100%;
      overflow: hidden;
    }
    progress::-webkit-progress-bar {
      background: #edf0e6;
      border-radius: 1rem;
    }
    progress::-webkit-progress-value {
      background: #1b715a;
      border-radius: 1rem;
    }
    progress::-moz-progress-bar {
      background: #1b715a;
      border-radius: 1rem;
    }
    .property-value strong {
      font-size: 0.65rem;
      font-weight: 600;
    }
    .low-compliance::-webkit-progress-value {
      background: #c0a150;
    }
    .low-compliance::-moz-progress-bar {
      background: #c0a150;
    }
    .no-plan {
      color: var(--muted);
      font-size: 0.62rem;
      margin: 0.5rem 0 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyHealth {
  readonly properties = input.required<DashboardProperty[]>();
  readonly propertyId = input('');
  readonly search = input('');
  readonly selected = output<string>();
  readonly filtered = computed(() =>
    this.properties().filter(
      (p) =>
        (!this.propertyId() || p.id === this.propertyId()) &&
        p.name.toLocaleLowerCase().includes(this.search().trim().toLocaleLowerCase()),
    ),
  );
  readonly shown = computed(() => this.filtered().slice(0, 3));
  compliance(property: DashboardProperty): number {
    return Math.round((100 * property.preventiveCompleted) / property.preventiveTotal);
  }
}
