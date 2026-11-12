import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  NavigationEnd,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AuthClient } from '../auth/auth-client';
import { routeApplication } from '../auth/auth.models';
import { DashboardClient } from '../dashboard/dashboard-client';
import { Icon } from '../shared/icon';
import { DashboardSearch } from '../dashboard/dashboard-search';

@Component({
  selector: 'app-account-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, DashboardSearch, NgTemplateOutlet],
  template: `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <div class="account-layout" [class.workspace-layout]="application === 'user'">
      <aside class="sidebar">
        <div class="sidebar-top">
          <a class="brand" [routerLink]="base"
            ><span class="brand-mark"><app-icon name="home" /></span> MAPREKO</a
          >
          <button
            type="button"
            class="menu-toggle"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="sidebar-content"
            aria-label="Mostrar navegacion"
            (click)="menuOpen.set(!menuOpen())"
          >
            <app-icon [name]="menuOpen() ? 'close' : 'menu'" />
          </button>
        </div>
        @if (application === 'user') {
          <p class="sidebar-motto">CUIDAR ES PREVENIR</p>
        }
        <div class="sidebar-content" id="sidebar-content" [class.mobile-open]="menuOpen()">
          @if (application === 'user') {
            <div class="space-label summary-space">
              <app-icon name="building" />
              <span>Mi espacio<small>Gestión de propiedades</small></span>
              <app-icon name="chevron" />
            </div>
          } @else {
            <div class="space-label">
              <span class="space-dot"></span
              >{{ application === 'admin' ? 'Equipo interno' : 'Mi espacio' }}
            </div>
          }
          <span class="sidebar-label">PRINCIPAL</span>
          <nav aria-label="Navegacion principal">
            <a
              [routerLink]="base"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              ariaCurrentWhenActive="page"
              ><app-icon name="grid" /> {{ application === 'admin' ? 'Mi cuenta' : 'Resumen' }}</a
            >
            @if (application === 'user') {
              <a
                [routerLink]="base + '/properties'"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                ><app-icon name="home" /> Propiedades</a
              >
              <a
                [routerLink]="base + '/maintenance'"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                ><app-icon name="calendar" /> Plan de mantenimiento</a
              >
              <a
                [routerLink]="base + '/learn'"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                ><app-icon name="book" /> Aprende</a
              >
              <a
                [routerLink]="base + '/reports'"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                ><app-icon name="chart" /> Reportes</a
              >
            } @else {
              <a
                [routerLink]="base + '/profile'"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                ><app-icon name="settings" /> Mi perfil</a
              >
              <a
                [routerLink]="base + '/sessions'"
                routerLinkActive="active"
                ariaCurrentWhenActive="page"
                ><app-icon name="clock" /> Seguridad y sesiones</a
              >
            }
          </nav>
          @if (application === 'user') {
            <div class="sidebar-encouragement">
              <p>Peque&ntilde;as acciones,<br /><strong>grandes ahorros.</strong></p>
              <span>Crea h&aacute;bitos para cuidar<br />lo que m&aacute;s importa.</span>
            </div>
          }
          <div class="sidebar-bottom">
            @if (application === 'user') {
              <nav aria-label="Configuracion de cuenta">
                <a
                  [routerLink]="base + '/profile'"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  ><app-icon name="settings" /> Configuraci&oacute;n</a
                >
                <a
                  [routerLink]="base + '/sessions'"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  ><app-icon name="clock" /> Mis sesiones</a
                >
              </nav>
            }
            <a
              class="sidebar-help"
              [routerLink]="base + '/help'"
              routerLinkActive="active"
              ariaCurrentWhenActive="page"
            >
              <app-icon name="help" /> Centro de ayuda
            </a>
            <button
              class="sidebar-help logout"
              type="button"
              (click)="logout()"
              [disabled]="busy()"
            >
              <app-icon name="logout" /> {{ busy() ? 'Cerrando...' : 'Cerrar sesion' }}
            </button>
            <span class="sidebar-copyright">Kolectiv - MAPREKO &copy; 2026</span>
          </div>
        </div>
      </aside>
      <div class="account-main">
        <header class="account-header">
          <div class="breadcrumb">
            <span>{{ application === 'admin' ? 'Equipo interno' : 'Mi espacio' }}</span><span
              aria-hidden="true"
              >/</span
            ><strong>{{ pageName() }}</strong>
          </div>
          @if (application === 'user') {
            <app-dashboard-search class="header-search" />
          }
          <ng-template #profileIdentity>
            @if (avatarUrl() && !avatarFailed()) {
              <img
                class="profile-initials profile-photo"
                [src]="avatarUrl()"
                width="32"
                height="32"
                alt=""
                aria-hidden="true"
                referrerpolicy="no-referrer"
                (error)="avatarFailed.set(true)"
              />
            } @else {
              <span class="profile-initials" aria-hidden="true">{{ initials() }}</span>
            }
            <span class="profile-copy"
              ><strong>{{ name() }}</strong
              ><span>{{ role() }}</span></span
            >
          </ng-template>
          @if (application === 'user') {
            <button
              #accountMenuButton
              class="header-profile profile-menu-toggle"
              type="button"
              popovertarget="account-menu"
              title="Abrir opciones de mi cuenta"
            >
              <ng-container [ngTemplateOutlet]="profileIdentity" />
              <app-icon name="chevron" />
            </button>
            <section
              #accountMenu
              id="account-menu"
              class="profile-menu"
              popover="auto"
              aria-label="Opciones de cuenta"
              (keydown.escape)="closeAccountMenu(accountMenu, accountMenuButton, $event)"
            >
              <a autofocus [routerLink]="base + '/profile'"
                ><app-icon name="settings" /> Configuración</a
              >
              <a [routerLink]="base + '/sessions'"><app-icon name="clock" /> Mis sesiones</a>
              <button type="button" (click)="logout()" [disabled]="busy()">
                <app-icon name="logout" /> {{ busy() ? 'Cerrando...' : 'Cerrar sesion' }}
              </button>
            </section>
          } @else {
            <a class="header-profile" [routerLink]="base + '/profile'" title="Abrir mi perfil">
              <ng-container [ngTemplateOutlet]="profileIdentity" />
            </a>
          }
        </header>
        <main id="main-content" tabindex="-1" class="page-content">
          @if (error()) {
            <p class="notice" role="alert">{{ error() }}</p>
          }
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styleUrl: './account-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountShell {
  readonly auth = inject(AuthClient);
  readonly dashboard = inject(DashboardClient);
  private readonly router = inject(Router);
  readonly application = routeApplication(inject(ActivatedRoute).snapshot);
  readonly base = this.application === 'admin' ? '/admin' : '/app';
  readonly name = computed(() => {
    const user = this.auth.sessions()[this.application]?.user;
    return (
      user?.displayName ||
      [user?.givenName, user?.familyName].filter(Boolean).join(' ') ||
      user?.email ||
      ''
    );
  });
  readonly busy = signal(false);
  readonly error = signal('');
  readonly menuOpen = signal(false);
  readonly year = new Date().getFullYear();
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  readonly pageName = computed(() =>
    this.currentUrl().includes('/profile')
      ? 'Mi perfil'
      : this.currentUrl().includes('/sessions')
        ? 'Mis sesiones'
        : this.currentUrl().includes('/maintenance')
          ? 'Plan de mantenimiento'
          : this.currentUrl().includes('/properties')
            ? 'Propiedades'
            : this.currentUrl().includes('/reports')
              ? 'Reportes'
              : this.currentUrl().includes('/learn')
                ? 'Aprende'
                : this.currentUrl().includes('/help')
                  ? 'Centro de ayuda'
                  : this.application === 'admin'
                    ? 'Mi cuenta'
                    : 'Resumen',
  );
  readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toUpperCase(),
  );
  readonly avatarUrl = computed(() => {
    const value = this.auth.sessions()[this.application]?.user?.avatarUrl;
    if (!value) return null;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' &&
        (url.hostname === 'googleusercontent.com' ||
          url.hostname.endsWith('.googleusercontent.com'))
        ? url.href
        : null;
    } catch {
      return null;
    }
  });
  readonly avatarFailed = signal(false);
  readonly role = computed(() => {
    const session = this.auth.sessions()[this.application];
    if (this.application === 'admin') return 'Equipo MAPREKO';
    const roles = session?.workspaces.map((w) => w.role) ?? [];
    return roles.includes('owner')
      ? 'Propietario'
      : roles.includes('admin')
        ? 'Administrador'
        : roles.includes('member')
          ? 'Miembro'
          : 'Consulta';
  });

  constructor() {
    effect(() => {
      this.avatarUrl();
      this.avatarFailed.set(false);
    });
    effect(() => {
      this.currentUrl();
      this.menuOpen.set(false);
    });
    effect(() => {
      const expired = this.auth.expired();
      if (expired?.application === this.application && !this.busy()) {
        this.dashboard.search.set('');
        void this.router.navigate([this.application === 'admin' ? '/admin/login' : '/login'], {
          queryParams: { error: expired.reason },
        });
      }
    });
  }

  async logout(): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.logout(this.application);
      this.dashboard.search.set('');
      await this.router.navigateByUrl(this.application === 'admin' ? '/admin/login' : '/login');
    } catch (error) {
      this.error.set(this.auth.errorMessage(error));
    } finally {
      this.busy.set(false);
    }
  }

  closeAccountMenu(menu: HTMLElement, button: HTMLButtonElement, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    menu.hidePopover();
    button.focus();
  }
}
