import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthClient } from '../auth/auth-client';
import { routeApplication } from '../auth/auth.models';

const loginErrors: Record<string, string> = {
  session_expired: 'Tu sesion ha terminado. Continua con Google para volver a entrar.',
  cancelled: 'Cancelaste el acceso con Google. Puedes intentarlo de nuevo cuando quieras.',
  access_denied: 'Tu cuenta esta inactiva o no tiene permiso para entrar a este entorno.',
  account_conflict:
    'Este correo ya pertenece a otra cuenta. Contacta con soporte para conservar tus datos.',
  invalid_identity: 'No pudimos verificar tu cuenta de Google. Intenta iniciar sesion de nuevo.',
  provider_unavailable: 'Google no esta disponible en este momento. Intenta de nuevo mas tarde.',
  service_unavailable: 'No pudimos conectar con MAPREKO. Intenta de nuevo.',
};

@Component({
  selector: 'app-login-page',
  imports: [RouterLink],
  template: `
    <main class="login-layout">
      <section class="login-story" aria-labelledby="story-title">
        <a class="brand" routerLink="/">
          <span class="brand-mark" aria-hidden="true">M</span> MAPREKO
        </a>
        <div class="story-copy">
          <span class="eyebrow">MENOS IMPREVISTOS. MAS TRANQUILIDAD.</span>
          <h2 id="story-title">Cuidar tu espacio<br />empieza aqui.</h2>
          <p>
            Un lugar para organizar el cuidado de tu hogar y mantener lo importante en buen estado.
          </p>
          <div class="home-outline" aria-hidden="true">
            <svg viewBox="0 0 240 180" fill="none">
              <path
                d="M25 90 120 15l95 75M50 72v90h140V72M95 162v-55h50v55M70 85h20M150 85h20"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="m177 33 8 8 17-17"
                stroke="var(--lime)"
                stroke-width="4"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="story-note">
            <span class="status-dot" aria-hidden="true"></span> El cuidado de hoy, la tranquilidad
            de manana.
          </div>
        </div>
        <p class="story-footer">Tu espacio. Tu bienestar. MAPREKO.</p>
      </section>
      <section class="login-content" aria-labelledby="login-title">
        <div class="login-card">
          <span class="badge">{{
            application === 'admin' ? 'MAPREKO ADMIN' : 'BIENVENIDO A MAPREKO'
          }}</span>
          <h1 id="login-title" tabindex="-1">
            {{ application === 'admin' ? 'Acceso del equipo' : 'Tu hogar, en buenas manos.' }}
          </h1>
          <p class="muted">
            {{
              application === 'admin'
                ? 'Un espacio exclusivo para el equipo interno autorizado de MAPREKO.'
                : 'Continua con tu cuenta de Google. Si es tu primera visita, crearemos tu cuenta automaticamente.'
            }}
          </p>
          @if (message()) {
            <p class="notice" role="alert">{{ message() }}</p>
          }
          @if (loading()) {
            <p class="muted" role="status">Preparando el acceso seguro...</p>
          } @else if (configured()) {
            <a class="button google-button" [href]="'/api/auth/google/start/' + application">
              <span class="google-letter" aria-hidden="true">G</span> Continuar con Google
            </a>
          } @else {
            <button type="button" class="button google-button" disabled>
              Continuar con Google
            </button>
            <p class="notice" role="status">El acceso con Google aun no esta disponible.</p>
            <button type="button" class="text-button" (click)="loadConfiguration()">
              Volver a comprobar
            </button>
          }
          <p class="login-privacy">
            Solo solicitamos tu nombre, correo y foto de perfil. Sin contrasenas adicionales.
          </p>
          <div class="login-divider"></div>
          <p class="muted small">
            {{
              application === 'admin'
                ? 'Las cuentas personales no conceden acceso administrativo.'
                : 'Una cuenta para tu espacio personal y las organizaciones de las que formes parte.'
            }}
          </p>
          <a class="text-link" [routerLink]="application === 'admin' ? '/login' : '/admin/login'">
            {{
              application === 'admin' ? 'Volver al acceso personal' : 'Acceso del equipo MAPREKO'
            }}
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
        <p class="login-footer">Pensado para cuidar lo que importa.</p>
        <footer class="login-legal">
          <nav aria-label="Información legal">
            <a routerLink="/terms">Términos y condiciones</a>
            <a routerLink="/privacy">Aviso de privacidad</a>
          </nav>
          <span>Kolectiv - MAPREKO © 2026</span>
        </footer>
      </section>
    </main>
  `,
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthClient);
  readonly application = routeApplication(this.route.snapshot);
  readonly loading = signal(true);
  readonly configured = signal(false);
  readonly message = signal(
    loginErrors[this.route.snapshot.queryParamMap.get('error') ?? ''] ?? '',
  );

  constructor() {
    void this.loadConfiguration();
  }

  async loadConfiguration(): Promise<void> {
    this.loading.set(true);
    try {
      this.configured.set((await this.auth.configuration()).googleConfigured);
    } catch (error) {
      this.message.set(this.auth.errorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
