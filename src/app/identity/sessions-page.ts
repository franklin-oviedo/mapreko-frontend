import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthClient } from '../auth/auth-client';
import { routeApplication } from '../auth/auth.models';
import type { SessionSummary } from '../auth/auth.models';

@Component({
  selector: 'app-sessions-page',
  imports: [DatePipe, RouterLink],
  template: `
    <span class="eyebrow-dark">TU SEGURIDAD</span>
    <h1 tabindex="-1">Seguridad y sesiones</h1>
    <p class="muted page-intro">
      Controla tus accesos a {{ application === 'admin' ? 'MAPREKO Admin' : 'MAPREKO User' }}.
    </p>
    @if (error()) {
      <p class="notice" role="alert">{{ error() }}</p>
    }
    @if (message()) {
      <p class="success" role="status">{{ message() }}</p>
    }
    @if (loading()) {
      <p class="muted" role="status">Consultando sesiones...</p>
    } @else if (sessions().length > 0 || !error()) {
      <section class="panel" aria-labelledby="sessions-title">
        <h2 id="sessions-title">Sesiones activas</h2>
        <ul class="session-list">
          @for (session of sessions(); track session.id) {
            <li>
              <div>
                <h3>
                  {{ session.current ? 'Esta sesion' : 'Otra sesion' }}
                  @if (session.current) {
                    <span class="badge">ACTUAL</span>
                  }
                </h3>
                <p class="muted small">
                  Inicio: {{ session.createdAt | date: 'dd/MM/yyyy HH:mm' }}<br />Ultima renovacion:
                  {{ session.lastSeenAt | date: 'dd/MM/yyyy HH:mm' }}<br />Expira:
                  {{ session.expiresAt | date: 'dd/MM/yyyy HH:mm' }}
                </p>
              </div>
              <button
                type="button"
                class="button secondary"
                [disabled]="busy() !== null"
                (click)="revoke(session)"
              >
                {{
                  busy() === session.id
                    ? 'Cerrando...'
                    : session.current
                      ? 'Cerrar esta sesion'
                      : 'Revocar sesion'
                }}
              </button>
            </li>
          } @empty {
            <li>No hay sesiones activas.</li>
          }
        </ul>
        <p class="muted small">
          Revocar una sesion invalida tambien sus tokens de renovacion. Las sesiones de la otra
          aplicacion no se modifican.
        </p>
      </section>
    }
    @if (error() && !loading()) {
      <button type="button" class="text-button section-title" (click)="load()">
        Volver a consultar
      </button>
    }
    <a
      class="text-link section-title inline-block"
      [routerLink]="application === 'admin' ? '/admin/profile' : '/app/profile'"
      >Volver a mi perfil</a
    >
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsPage {
  private readonly auth = inject(AuthClient);
  private readonly router = inject(Router);
  readonly application = routeApplication(inject(ActivatedRoute).snapshot);
  readonly sessions = signal<SessionSummary[]>([]);
  readonly loading = signal(true);
  readonly busy = signal<string | null>(null);
  readonly error = signal('');
  readonly message = signal('');

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.sessions.set(await this.auth.listSessions(this.application));
    } catch (error) {
      this.error.set(this.auth.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }

  async revoke(session: SessionSummary): Promise<void> {
    this.busy.set(session.id);
    this.error.set('');
    this.message.set('');
    try {
      await this.auth.revoke(this.application, session.id);
      if (session.current) {
        await this.router.navigateByUrl(this.application === 'admin' ? '/admin/login' : '/login');
      } else {
        this.sessions.update((sessions) => sessions.filter((item) => item.id !== session.id));
        this.message.set('La sesion ha sido revocada.');
      }
    } catch (error) {
      this.error.set(this.auth.errorMessage(error));
    } finally {
      this.busy.set(null);
    }
  }
}
