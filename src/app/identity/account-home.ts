import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthClient } from '../auth/auth-client';
import { routeApplication } from '../auth/auth.models';

@Component({
  selector: 'app-account-home',
  imports: [RouterLink],
  template: `
    <span class="eyebrow-dark">{{
      application === 'admin' ? 'ENTORNO INTERNO' : 'TU PUNTO DE PARTIDA'
    }}</span>
    <h1 tabindex="-1">
      {{ application === 'admin' ? 'Bienvenido al equipo.' : 'Un espacio para cuidar el tuyo.' }}
    </h1>
    <p class="muted page-intro">
      Tu cuenta esta lista. Completa tu perfil y controla donde mantienes la sesion abierta.
    </p>
    <section class="panel welcome-panel" aria-labelledby="welcome-title">
      <span class="badge">ACCESO VERIFICADO</span>
      <h2 id="welcome-title">Hola, {{ name() }}.</h2>
      <p class="muted">
        {{
          application === 'admin'
            ? 'Tu acceso administrativo se ha autorizado de forma independiente de tu cuenta personal.'
            : 'Tu cuenta de Google esta conectada. Tus datos de perfil y tus sesiones se gestionan desde aqui.'
        }}
      </p>
      <a class="button primary" [routerLink]="base + '/profile'"
        >Completar mi perfil <span aria-hidden="true">&rarr;</span></a
      >
    </section>
    @if (application === 'user') {
      <section aria-labelledby="workspaces-title">
        <h2 id="workspaces-title" class="section-title">Tus espacios</h2>
        <div class="card-grid">
          @for (workspace of session()?.workspaces; track workspace.id) {
            <article class="panel">
              <span class="badge">{{
                workspace.kind === 'personal' ? 'PERSONAL' : 'BUSINESS'
              }}</span>
              <h3>{{ workspace.name }}</h3>
              <p class="muted small">
                {{
                  workspace.kind === 'personal'
                    ? 'Tu espacio privado.'
                    : 'Organizacion de la que formas parte.'
                }}
              </p>
            </article>
          } @empty {
            <p class="muted">No tienes espacios activos asociados a tu cuenta.</p>
          }
        </div>
        <p class="muted small section-title">
          Las propiedades y los planes de mantenimiento se incorporaran en la siguiente etapa.
        </p>
      </section>
    } @else {
      <section class="panel section-title" aria-labelledby="permissions-title">
        <h2 id="permissions-title">Acceso autorizado</h2>
        <p class="muted">
          Rol interno: {{ session()?.roles?.join(', ') }}. Los modulos de administracion se
          incorporaran en las siguientes etapas.
        </p>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHome {
  readonly application = routeApplication(inject(ActivatedRoute).snapshot);
  private readonly auth = inject(AuthClient);
  readonly session = computed(() => this.auth.sessions()[this.application]);
  readonly base = this.application === 'admin' ? '/admin' : '/app';
  readonly name = computed(
    () => this.session()?.user.displayName || this.session()?.user.givenName || 'bienvenido',
  );
}
