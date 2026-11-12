import { Routes } from '@angular/router';
import { sessionGuard } from './auth/session.guard';
import type { Application } from './auth/auth.models';

function applicationRoutes(application: Application): Routes {
  const data = { application };
  return [
    {
      path: application === 'admin' ? 'admin' : 'app',
      data,
      loadComponent: () => import('./identity/account-shell').then((module) => module.AccountShell),
      children: [
        {
          path: '',
          data,
          canActivate: [sessionGuard],
          title: application === 'user' ? 'Resumen | MAPREKO' : 'Mi cuenta | MAPREKO',
          loadComponent: () =>
            application === 'user'
              ? import('./dashboard/summary-page').then((module) => module.SummaryPage)
              : import('./identity/account-home').then((module) => module.AccountHome),
        },
        {
          path: 'profile',
          data,
          canActivate: [sessionGuard],
          title: 'Mi perfil | MAPREKO',
          loadComponent: () =>
            import('./identity/profile-page').then((module) => module.ProfilePage),
        },
        {
          path: 'sessions',
          data,
          canActivate: [sessionGuard],
          title: 'Mis sesiones | MAPREKO',
          loadComponent: () =>
            import('./identity/sessions-page').then((module) => module.SessionsPage),
        },
        {
          path: 'help',
          data,
          canActivate: [sessionGuard],
          title: 'Centro de ayuda | MAPREKO',
          loadComponent: () => import('./help/help-page').then((module) => module.HelpPage),
        },
        ...(application === 'user'
          ? [
              {
                path: 'properties',
                data,
                canActivate: [sessionGuard],
                title: 'Propiedades | MAPREKO',
                loadComponent: () =>
                  import('./properties/properties-page').then((module) => module.PropertiesPage),
              },
              {
                path: 'reports',
                data,
                canActivate: [sessionGuard],
                title: 'Reportes | MAPREKO',
                loadComponent: () =>
                  import('./reports/reports-page').then((module) => module.ReportsPage),
              },
              {
                path: 'maintenance',
                data,
                canActivate: [sessionGuard],
                title: 'Plan de mantenimiento | MAPREKO',
                loadComponent: () =>
                  import('./maintenance/maintenance-page').then((module) => module.MaintenancePage),
              },
              {
                path: 'learn',
                data,
                canActivate: [sessionGuard],
                title: 'Aprende | MAPREKO',
                loadComponent: () =>
                  import('./knowledge/learn-page').then((module) => module.LearnPage),
              },
              {
                path: 'learn/:slug',
                data,
                canActivate: [sessionGuard],
                title: 'Guía de mantenimiento | MAPREKO',
                loadComponent: () =>
                  import('./knowledge/learn-page').then((module) => module.LearnPage),
              },
            ]
          : []),
      ],
    },
  ];
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'MAPREKO | Cuida tu espacio. Vive con más tranquilidad.',
    loadComponent: () => import('./landing/landing-page').then((module) => module.LandingPage),
  },
  {
    path: 'login',
    data: { application: 'user' },
    title: 'Bienvenido | MAPREKO',
    loadComponent: () => import('./identity/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'admin/login',
    data: { application: 'admin' },
    title: 'Acceso interno | MAPREKO',
    loadComponent: () => import('./identity/login-page').then((module) => module.LoginPage),
  },
  {
    path: 'terms',
    title: 'Términos y condiciones | MAPREKO',
    data: { legalPage: 'terms' },
    loadComponent: () => import('./legal/legal-page').then((module) => module.LegalPage),
  },
  {
    path: 'privacy',
    title: 'Aviso de privacidad | MAPREKO',
    data: { legalPage: 'privacy' },
    loadComponent: () => import('./legal/legal-page').then((module) => module.LegalPage),
  },
  ...applicationRoutes('user'),
  ...applicationRoutes('admin'),
  { path: '**', redirectTo: 'app' },
];
