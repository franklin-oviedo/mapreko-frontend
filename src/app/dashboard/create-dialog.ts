import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthClient } from '../auth/auth-client';
import { Icon } from '../shared/icon';
import { DashboardClient } from './dashboard-client';
import type { DashboardProperty, PropertyKind, TaskPriority } from './dashboard.models';

@Component({
  selector: 'app-create-dialog',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <dialog
      #dialog
      aria-labelledby="create-title"
      aria-describedby="create-description"
      (cancel)="cancel($event)"
    >
      <header class="dialog-header">
        <div>
          <span class="eyebrow-dark">CUIDAR ES PREVENIR</span>
          <h2 id="create-title" tabindex="-1" #heading>
            {{ mode() === 'task' ? 'Nueva tarea' : 'Registrar propiedad' }}
          </h2>
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
      <p id="create-description" class="muted small">
        {{
          mode() === 'task'
            ? 'Una pequeña acción hoy puede evitar un imprevisto mañana.'
            : 'Añade tu primera propiedad para empezar a organizar su cuidado.'
        }}
      </p>
      @if (error()) {
        <p class="notice" role="alert">{{ error() }}</p>
      }
      @if (mode() === 'task') {
        <form [formGroup]="taskForm" (ngSubmit)="saveTask()">
          <fieldset [disabled]="busy()">
            <div class="field">
              <label for="task-title">¿Qué necesitas hacer?</label>
              <input
                id="task-title"
                formControlName="title"
                maxlength="160"
                required
                placeholder="Ej. Revisar filtración en el techo"
                [attr.aria-invalid]="
                  taskForm.controls.title.touched && taskForm.controls.title.invalid
                "
              />
            </div>
            <div class="field">
              <label for="task-property">Propiedad</label>
              <select id="task-property" formControlName="propertyId" required>
                @for (property of writableProperties(); track property.id) {
                  <option [value]="property.id">{{ property.name }}</option>
                }
              </select>
            </div>
            <div class="form-grid">
              <div class="field">
                <label for="task-due">Fecha límite</label>
                <input
                  id="task-due"
                  type="date"
                  formControlName="dueOn"
                  required
                  aria-describedby="task-zone"
                />
              </div>
              <div class="field">
                <label for="task-priority">Prioridad</label>
                <select id="task-priority" formControlName="priority">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>
            <p id="task-zone" class="muted small">
              Vence al finalizar el día en la zona horaria de la propiedad ({{ taskTimeZone() }}).
            </p>
            <div class="field">
              <label for="task-description">Detalles <span class="muted">(opcional)</span></label>
              <textarea
                id="task-description"
                formControlName="description"
                rows="3"
                maxlength="2000"
              ></textarea>
            </div>
          </fieldset>
          <footer class="dialog-actions">
            <button type="button" class="button secondary" [disabled]="busy()" (click)="close()">
              Cancelar
            </button>
            <button type="submit" class="button primary" [disabled]="busy()">
              {{ busy() ? 'Guardando…' : 'Crear tarea' }} <app-icon name="arrow" />
            </button>
          </footer>
        </form>
      } @else {
        <form [formGroup]="propertyForm" (ngSubmit)="saveProperty()">
          <fieldset [disabled]="busy()">
            <div class="field">
              <label for="property-name">Nombre de la propiedad</label>
              <input
                id="property-name"
                formControlName="name"
                maxlength="120"
                required
                placeholder="Ej. Mi apartamento"
              />
            </div>
            <div class="form-grid">
              <div class="field">
                <label for="property-workspace">Espacio</label>
                <select id="property-workspace" formControlName="workspaceId" required>
                  @for (workspace of writableWorkspaces(); track workspace.id) {
                    <option [value]="workspace.id">{{ workspace.name }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label for="property-kind">Tipo</label>
                <select id="property-kind" formControlName="kind">
                  <option value="house">Casa</option>
                  <option value="apartment">Apartamento</option>
                  <option value="building">Edificio residencial</option>
                  <option value="commercial">Comercial</option>
                  <option value="other">Otra propiedad</option>
                </select>
              </div>
            </div>
            <div class="field">
              <label for="property-address">Dirección</label>
              <input
                id="property-address"
                formControlName="address"
                maxlength="240"
                required
                autocomplete="street-address"
              />
            </div>
          </fieldset>
          <footer class="dialog-actions">
            <button type="button" class="button secondary" [disabled]="busy()" (click)="close()">
              Cancelar
            </button>
            <button type="submit" class="button primary" [disabled]="busy()">
              {{ busy() ? 'Guardando…' : 'Registrar propiedad' }} <app-icon name="arrow" />
            </button>
          </footer>
        </form>
      }
    </dialog>
  `,
  styleUrl: './create-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDialog {
  readonly properties = input.required<DashboardProperty[]>();
  readonly created = output<{ kind: 'task' | 'property'; propertyId: string }>();
  readonly writableProperties = computed(() => this.properties().filter((p) => p.canCreateTask));
  private readonly auth = inject(AuthClient);
  private readonly client = inject(DashboardClient);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly heading = viewChild.required<ElementRef<HTMLHeadingElement>>('heading');
  readonly writableWorkspaces = computed(
    () =>
      this.auth
        .sessions()
        .user?.workspaces.filter((w) => w.role === 'owner' || w.role === 'admin') ?? [],
  );
  readonly mode = signal<'task' | 'property'>('task');
  readonly busy = signal(false);
  readonly error = signal('');
  readonly taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(160), Validators.pattern(/\S/)]],
    propertyId: ['', Validators.required],
    dueOn: ['', Validators.required],
    priority: this.fb.control<TaskPriority>('medium'),
    description: ['', Validators.maxLength(2000)],
  });
  readonly propertyForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
    workspaceId: ['', Validators.required],
    kind: this.fb.control<PropertyKind>('house'),
    address: ['', [Validators.required, Validators.maxLength(240), Validators.pattern(/\S/)]],
  });
  private readonly taskPropertyId = toSignal(this.taskForm.controls.propertyId.valueChanges, {
    initialValue: '',
  });
  readonly taskTimeZone = computed(
    () =>
      this.properties().find((property) => property.id === this.taskPropertyId())?.timeZone ?? '',
  );

  open(mode: 'task' | 'property', propertyId = ''): void {
    this.mode.set(mode);
    this.error.set('');
    const property =
      this.writableProperties().find((p) => p.id === propertyId) ?? this.writableProperties()[0];
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: property?.timeZone ?? this.auth.sessions().user?.user.timeZone ?? 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
    this.taskForm.reset({
      title: '',
      propertyId: property?.id ?? '',
      dueOn: `${part('year')}-${part('month')}-${part('day')}`,
      priority: 'medium',
      description: '',
    });
    this.propertyForm.reset({
      workspaceId: this.writableWorkspaces()[0]?.id ?? '',
      kind: 'house',
      name: '',
      address: '',
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
  async saveTask(): Promise<void> {
    if (this.busy()) return;
    this.taskForm.markAllAsTouched();
    if (this.taskForm.invalid) {
      this.error.set('Revisa el título, la propiedad y la fecha límite.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const value = this.taskForm.getRawValue();
    try {
      await this.client.createTask({
        ...value,
        title: value.title.trim(),
        description: value.description.trim(),
      });
      this.dialog().nativeElement.close();
      this.created.emit({ kind: 'task', propertyId: value.propertyId });
    } catch (error) {
      this.error.set(this.client.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
  async saveProperty(): Promise<void> {
    if (this.busy()) return;
    this.propertyForm.markAllAsTouched();
    if (this.propertyForm.invalid) {
      this.error.set('Completa el nombre, el espacio y la dirección.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    const value = this.propertyForm.getRawValue();
    try {
      const property = await this.client.createProperty({
        ...value,
        name: value.name.trim(),
        address: value.address.trim(),
      });
      this.dialog().nativeElement.close();
      this.created.emit({ kind: 'property', propertyId: property.id });
    } catch (error) {
      this.error.set(this.client.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }
}
