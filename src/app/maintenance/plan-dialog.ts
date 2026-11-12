import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthClient } from '../auth/auth-client';
import type { DashboardProperty, TaskPriority } from '../dashboard/dashboard.models';
import { Icon } from '../shared/icon';
import { MaintenanceClient } from './maintenance-client';

@Component({
  selector: 'app-plan-dialog',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <dialog
      #dialog
      aria-labelledby="plan-dialog-title"
      aria-describedby="plan-dialog-description"
      (cancel)="cancel($event)"
    >
      <header class="dialog-header">
        <div>
          <span class="overline">CUIDADO PREVENTIVO</span>
          <h2 id="plan-dialog-title" #heading tabindex="-1">Crear plan</h2>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Cerrar formulario"
          [disabled]="busy()"
          (click)="close()"
        >
          <app-icon name="close" />
        </button>
      </header>
      <p class="muted small" id="plan-dialog-description">
        Define una actividad, su frecuencia y la próxima fecha. Guardamos el plan y su primera tarea
        juntos.
      </p>
      @if (error()) {
        <p class="notice" role="alert">{{ error() }}</p>
      }
      <form [formGroup]="form" (ngSubmit)="save()">
        <fieldset [disabled]="busy()">
          <div class="field">
            <label for="plan-title">Nombre del plan</label
            ><input
              id="plan-title"
              formControlName="title"
              maxlength="160"
              required
              placeholder="Ej. Mantenimiento del aire acondicionado"
            />
          </div>
          <div class="field">
            <label for="plan-property">Propiedad</label>
            <select id="plan-property" formControlName="propertyId" required>
              @for (property of writableProperties(); track property.id) {
                <option [value]="property.id">{{ property.name }}</option>
              }
            </select>
          </div>
          <div class="field">
            <label for="plan-task">Actividad programada</label
            ><input
              id="plan-task"
              formControlName="taskTitle"
              maxlength="160"
              required
              placeholder="Ej. Revisar y limpiar el filtro"
            />
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="plan-recurrence">Frecuencia</label
              ><select id="plan-recurrence" formControlName="recurrenceUnit">
                <option value="week">Cada semana</option>
                <option value="month">Cada mes</option>
                <option value="year">Cada año</option>
                <option value="day">Cada día</option>
              </select>
            </div>
            <div class="field">
              <label for="plan-interval">Cada</label>
              <div class="interval-control">
                <input
                  id="plan-interval"
                  type="number"
                  formControlName="recurrenceInterval"
                  min="1"
                  max="365"
                  required
                /><span>{{ unitLabel() }}</span>
              </div>
            </div>
          </div>
          <div class="form-grid">
            <div class="field">
              <label for="plan-start">Comienza el</label
              ><input id="plan-start" type="date" formControlName="startsOn" required />
            </div>
            <div class="field">
              <label for="plan-next">Primera fecha límite</label
              ><input id="plan-next" type="date" formControlName="firstDueOn" required />
            </div>
          </div>
          <div class="field">
            <label for="plan-priority">Prioridad</label
            ><select id="plan-priority" formControlName="priority">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div class="field">
            <label for="plan-description"
              >Notas del plan <span class="muted">(opcional)</span></label
            ><textarea
              id="plan-description"
              rows="3"
              maxlength="2000"
              formControlName="description"
            ></textarea>
          </div>
          <div class="field">
            <label for="plan-instructions"
              >Instrucciones de la primera tarea <span class="muted">(opcional)</span></label
            ><textarea
              id="plan-instructions"
              rows="3"
              maxlength="2000"
              formControlName="instructions"
            ></textarea>
          </div>
        </fieldset>
        <footer class="dialog-actions">
          <button type="button" class="button secondary" [disabled]="busy()" (click)="close()">
            Cancelar
          </button>
          <button type="submit" class="button primary" [disabled]="busy()">
            {{ busy() ? 'Guardando…' : 'Guardar plan' }} <app-icon name="arrow" />
          </button>
        </footer>
      </form>
    </dialog>
  `,
  styleUrl: './plan-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanDialog {
  readonly properties = input.required<DashboardProperty[]>();
  readonly created = output<void>();
  private readonly auth = inject(AuthClient);
  private readonly api = inject(MaintenanceClient);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly writableProperties = computed(() =>
    this.properties().filter((property) => property.canCreateTask),
  );
  readonly form = this.fb.group({
    propertyId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(160), Validators.pattern(/\S/)]],
    taskTitle: ['', [Validators.required, Validators.maxLength(160), Validators.pattern(/\S/)]],
    recurrenceUnit: this.fb.control<'day' | 'week' | 'month' | 'year'>('month'),
    recurrenceInterval: [1, [Validators.required, Validators.min(1), Validators.max(365)]],
    startsOn: ['', Validators.required],
    firstDueOn: ['', Validators.required],
    priority: this.fb.control<TaskPriority>('medium'),
    description: ['', Validators.maxLength(2000)],
    instructions: [''],
  });
  private readonly unit = toSignal(this.form.controls.recurrenceUnit.valueChanges, {
    initialValue: 'month' as const,
  });
  readonly unitLabel = computed(
    () => ({ day: 'día(s)', week: 'semana(s)', month: 'mes(es)', year: 'año(s)' })[this.unit()],
  );
  open(): void {
    this.error.set('');
    const now = new Date();
    const property = this.writableProperties()[0];
    const timeZone = property?.timeZone ?? this.auth.sessions().user?.user.timeZone ?? 'UTC';
    const parts = new Intl.DateTimeFormat('en', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const datePart = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    const today = `${datePart('year')}-${datePart('month')}-${datePart('day')}`;
    this.form.reset({
      propertyId: property?.id ?? '',
      title: '',
      taskTitle: '',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      startsOn: today,
      firstDueOn: today,
      priority: 'medium',
      description: '',
      instructions: '',
    });
    this.dialog().nativeElement.showModal();
    this.heading().nativeElement.focus();
  }
  close(): void {
    if (!this.busy()) this.dialog().nativeElement.close();
  }
  cancel(event: Event): void {
    if (this.busy()) event.preventDefault();
  }
  async save(): Promise<void> {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid || value.firstDueOn < value.startsOn) {
      this.error.set(
        value.firstDueOn < value.startsOn
          ? 'La primera fecha límite no puede ser anterior al inicio.'
          : 'Completa el título, la propiedad, la frecuencia y las fechas.',
      );
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.api.createPlan({
        ...value,
        title: value.title.trim(),
        taskTitle: value.taskTitle.trim(),
        description: value.description.trim(),
        instructions: value.instructions.trim(),
      });
      this.dialog().nativeElement.close();
      this.created.emit();
    } catch (error) {
      this.error.set(this.api.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
