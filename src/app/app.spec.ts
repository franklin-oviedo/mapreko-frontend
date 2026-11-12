import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthClient } from './auth/auth-client';
import { testSession } from './auth/auth.test-fixtures';
import type { DashboardSummary } from './dashboard/dashboard.models';

const emptySummary: DashboardSummary = {
  generatedAt: '2026-11-11T12:00:00Z',
  timeZone: 'UTC',
  properties: [],
  tasks: [],
  metrics: {
    propertyCount: 0,
    buildingCount: 0,
    housingCount: 0,
    otherCount: 0,
    monthlyTasks: 0,
    completedMonthly: 0,
    overdue: 0,
    highPriority: 0,
    attentionCount: 0,
    pendingTasks: 0,
    compliance: null,
    complianceChange: null,
  },
};

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders the lazy login with cancellation feedback and the Google redirect', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/login?error=cancelled');
    TestBed.inject(HttpTestingController)
      .expectOne('/api/auth/config')
      .flush({ googleConfigured: true });
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Tu hogar');
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('Cancelaste');
    expect(compiled.querySelector('.google-button')?.getAttribute('href')).toBe(
      '/api/auth/google/start/user',
    );
    expect(compiled.querySelector('.brand')?.getAttribute('href')).toBe('/');
  });

  it('opens the public landing without authentication and preserves contact anchor focus', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await router.navigateByUrl('/');
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-landing-page h1')?.textContent).toContain(
      'Cuida tu espacio.',
    );
    expect(element.querySelector('.hero .primary')?.getAttribute('href')).toBe('/login');
    expect(element.querySelector('address a[href="mailto:kolectivtech@gmail.com"]')).not.toBeNull();
    expect(element.querySelector('address a[href="mailto:otniel298@gmail.com"]')).not.toBeNull();
    expect(element.querySelector('address a[href="tel:+18299269050"]')).not.toBeNull();
    const whatsapp = element.querySelector('a[href="https://wa.me/18299269050"]');
    expect(whatsapp?.getAttribute('rel')).toBe('noopener noreferrer');
    expect(whatsapp?.textContent).toContain('abre una pestaña nueva');
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const contact = element.querySelector<HTMLElement>('#contacto');
    if (!contact) throw new Error('Expected the landing contact section');
    contact.focus();
    await router.navigateByUrl('/#contacto');
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    expect(element.ownerDocument.activeElement).toBe(contact);
    await router.navigateByUrl('/terms');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelector('.legal-back')?.getAttribute('href')).toBe('/');
    http.verify();
  });

  it('keeps the workspace protected after introducing the public landing', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    const navigation = router.navigateByUrl('/app');
    const configuration = await vi.waitFor(() => http.expectOne('/api/auth/config'));
    configuration.flush({ googleConfigured: true });
    const session = await vi.waitFor(() => http.expectOne('/api/auth/user/session'));
    session.flush({}, { status: 401, statusText: 'Unauthorized' });
    await navigation;
    fixture.detectChanges();
    const loginConfiguration = await vi.waitFor(() => http.expectOne('/api/auth/config'));
    loginConfiguration.flush({ googleConfigured: true });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(router.url).toBe('/login');
    expect((fixture.nativeElement as HTMLElement).querySelector('app-summary-page')).toBeNull();
    http.expectNone('/api/dashboard/user/summary');
    http.verify();
  });

  it('preserves the shared workspace menu and footer when navigating between feature pages', async () => {
    const session = {
      ...testSession,
      user: { ...testSession.user, avatarUrl: 'https://lh3.googleusercontent.com/avatar' },
    };
    TestBed.overrideProvider(AuthClient, {
      useValue: {
        sessions: signal({ user: session, admin: null }),
        expired: signal(null),
        configuration: async () => ({ googleConfigured: true }),
        restore: async () => session,
        errorMessage: () => 'No pudimos conectar con MAPREKO.',
      },
    });
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await router.navigateByUrl('/app?view=all#main-content');
    fixture.detectChanges();
    const summaryRequest = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    summaryRequest.flush(emptySummary);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.workspace-layout')).not.toBeNull();
    expect(element.querySelector('.profile-menu-toggle')?.getAttribute('popovertarget')).toBe(
      'account-menu',
    );
    expect(element.querySelector('#account-menu a[autofocus]')?.getAttribute('href')).toBe(
      '/app/profile',
    );
    expect(element.querySelector('#account-menu a[href="/app/sessions"]')).not.toBeNull();
    expect(element.querySelector('.sidebar-bottom .logout')).not.toBeNull();
    expect(element.querySelector('.header-profile img')?.getAttribute('src')).toBe(
      session.user.avatarUrl,
    );
    const menu = element.querySelector<HTMLElement>('#account-menu');
    if (!menu) throw new Error('Expected the summary account menu');
    menu.hidePopover = vi.fn();
    menu.querySelector<HTMLAnchorElement>('a')?.focus();
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true,
    });
    menu.dispatchEvent(escape);
    expect(menu.hidePopover).toHaveBeenCalledOnce();
    expect(element.ownerDocument.activeElement).toBe(element.querySelector('.profile-menu-toggle'));

    const pages = [
      { route: '/app/properties', endpoints: ['/api/dashboard/user/summary'] },
      {
        route: '/app/maintenance',
        endpoints: ['/api/dashboard/user/summary', '/api/maintenance/user/plans'],
      },
      { route: '/app/learn', endpoints: ['/api/maintenance/user/articles'] },
      { route: '/app/reports', endpoints: ['/api/dashboard/user/summary'] },
    ];
    for (const page of pages) {
      await router.navigateByUrl(page.route);
      fixture.detectChanges();
      for (const endpoint of page.endpoints) {
        const request = await vi.waitFor(() => http.expectOne((r) => r.url === endpoint));
        if (endpoint === '/api/dashboard/user/summary') {
          request.flush(emptySummary);
        } else {
          request.flush({}, { status: 503, statusText: 'Unavailable' });
        }
      }
      await fixture.whenStable();
      fixture.detectChanges();
      expect(element.querySelector('.workspace-layout')).not.toBeNull();
      expect(element.querySelector('#account-menu')).not.toBeNull();
      expect(
        Array.from(element.querySelectorAll('.sidebar-bottom a')).map((a) =>
          a.getAttribute('href'),
        ),
      ).toEqual(['/app/profile', '/app/sessions', '/app/help']);
      expect(element.querySelector('.sidebar-bottom .logout')).not.toBeNull();
      expect(element.querySelector('.sidebar-copyright')?.textContent).toBe(
        'Kolectiv - MAPREKO © 2026',
      );
      expect(element.querySelector('nav a[aria-current="page"]')?.getAttribute('href')).toBe(
        page.route,
      );
      expect(element.querySelector('.header-profile img')?.getAttribute('src')).toBe(
        session.user.avatarUrl,
      );
    }
    http.verify();
  });
});
