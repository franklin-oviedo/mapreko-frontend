import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Icon } from '../shared/icon';
import { DashboardClient } from './dashboard-client';

@Component({
  selector: 'app-dashboard-search',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <form role="search" (submit)="submit($event)">
      <app-icon name="search" />
      <label class="sr-only" for="dashboard-search">Buscar tareas o propiedades</label>
      <input
        id="dashboard-search"
        type="search"
        [formControl]="control"
        placeholder="Buscar tareas, propiedades…"
        maxlength="100"
      />
    </form>
  `,
  styles: `
    form {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      color: var(--muted);
    }
    app-icon {
      width: 1rem;
      height: 1rem;
    }
    input {
      font: inherit;
      font-size: 0.7rem;
      border: 0;
      background: transparent;
      color: var(--ink);
      padding: 0.55rem 0.2rem;
      width: 100%;
      min-width: 0;
    }
    input::placeholder {
      color: var(--muted);
      opacity: 1;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSearch {
  private readonly client = inject(DashboardClient);
  private readonly router = inject(Router);
  readonly control = new FormControl(this.client.search(), { nonNullable: true });
  constructor() {
    this.control.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.client.search.set(value));
    effect(() => {
      const value = this.client.search();
      if (value !== this.control.value) this.control.setValue(value, { emitEvent: false });
    });
  }
  submit(event: Event): void {
    event.preventDefault();
    void this.router.navigateByUrl('/app');
  }
}
