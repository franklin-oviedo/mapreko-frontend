import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthClient, SKIP_REFRESH } from './auth-client';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith('/api/')) return next(request);
  const protectedRequest = request.clone({
    withCredentials: true,
    ...(!['GET', 'HEAD', 'OPTIONS'].includes(request.method)
      ? { setHeaders: { 'X-Mapreko-Request': '1' } }
      : {}),
  });
  const match = /^\/api\/(?:auth|dashboard)\/(user|admin)\//.exec(request.url);
  const application = match?.[1];
  if (
    (application !== 'user' && application !== 'admin') ||
    request.context.get(SKIP_REFRESH) ||
    /\/(refresh|logout)$/.test(request.url)
  ) {
    return next(protectedRequest);
  }
  const auth = inject(AuthClient);
  return next(protectedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401)
        return throwError(() => error);
      return from(auth.refresh(application)).pipe(switchMap(() => next(protectedRequest)));
    }),
  );
};
