import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Icon } from '../shared/icon';
import type { DashboardSummary } from './dashboard.models';

@Component({
  selector: 'app-summary-metrics',
  imports: [Icon],
  template: `
    <section class="metrics" aria-label="Indicadores del resumen">
      <article>
        <div class="label">Propiedades <app-icon name="building" /></div>
        <strong>{{ metrics().propertyCount }}</strong>
        <p>
          {{ metrics().buildingCount }}
          {{ metrics().buildingCount === 1 ? 'residencial' : 'residenciales' }} ·
          {{ metrics().housingCount }} {{ metrics().housingCount === 1 ? 'vivienda' : 'viviendas' }}
          @if (metrics().otherCount) {
            · {{ metrics().otherCount }} {{ metrics().otherCount === 1 ? 'otra' : 'otras' }}
          }
        </p>
      </article>
      <article>
        <div class="label">Tareas este mes <app-icon name="clock" /></div>
        <strong>{{ metrics().monthlyTasks }}</strong>
        <p>{{ metrics().completedMonthly }} completadas de {{ metrics().monthlyTasks }}</p>
      </article>
      <article class="attention">
        <div class="label">Requieren atención <app-icon name="alert" /></div>
        <strong>{{ metrics().attentionCount }}</strong>
        <p>
          {{ metrics().overdue }} {{ metrics().overdue === 1 ? 'vencida' : 'vencidas' }} ·
          {{ metrics().highPriority }} de prioridad alta
        </p>
      </article>
      <article>
        <div class="label">Cumplimiento <app-icon name="check" /></div>
        <strong>{{ metrics().compliance === null ? '—' : metrics().compliance + '%' }}</strong>
        <p>
          @if (metrics().complianceChange !== null) {
            <span class="change-value" [class.negative]="(metrics().complianceChange ?? 0) < 0"
              >{{ (metrics().complianceChange ?? 0) > 0 ? '+' : ''
              }}{{ metrics().complianceChange }} puntos</span
            >
            frente al mes anterior
          } @else {
            {{
              metrics().compliance === null
                ? 'Sin tareas preventivas este mes'
                : 'Sin referencia del mes anterior'
            }}
          }
        </p>
      </article>
    </section>
  `,
  styles: `
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }
    article {
      background: white;
      min-width: 0;
      min-height: 8rem;
      padding: 1.2rem;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
    }
    .label {
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      color: var(--muted);
    }
    .label app-icon {
      color: #6b7b63;
      width: 1rem;
      height: 1rem;
    }
    strong {
      display: block;
      font-size: 2rem;
      font-weight: 600;
      letter-spacing: -0.04em;
      margin: 0.65rem 0 0.3rem;
      line-height: 1.2;
    }
    p {
      font-size: 0.65rem;
      color: var(--muted);
      margin: 0;
      line-height: 1.65;
    }
    .attention strong,
    .attention app-icon {
      color: #906524;
    }
    .change-value {
      color: #356047;
    }
    .change-value.negative {
      color: #9b4936;
    }
    @media (max-width: 1000px) {
      .metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (max-width: 600px) {
      .metrics {
        gap: 0.65rem;
      }
      article {
        padding: 1rem;
      }
      .label {
        font-size: 0.65rem;
      }
      strong {
        font-size: 1.9rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryMetrics {
  readonly metrics = input.required<DashboardSummary['metrics']>();
}
