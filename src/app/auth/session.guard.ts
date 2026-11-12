import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { AuthClient } from './auth-client';
import { routeApplication } from './auth.models';

export const sessionGuard: CanActivateFn = async (route) => {
  const auth = inject(AuthClient);
  const router = inject(Router);
  const application = routeApplication(route);
  const login = application === 'admin' ? '/admin/login' : '/login';
  try {
    if (!(await auth.configuration()).googleConfigured) return router.createUrlTree([login]);
    const session = await auth.restore(application);
    return session ? true : router.createUrlTree([login]);
  } catch (error) {
    const reason =
      error instanceof HttpErrorResponse && error.status === 403
        ? 'access_denied'
        : 'service_unavailable';
    auth.errorMessage(error);
    return router.createUrlTree([login], { queryParams: { error: reason } });
  }
};
