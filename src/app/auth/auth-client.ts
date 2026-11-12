import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpContext, HttpContextToken, HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { Application, AuthSession, ProfileUpdate, SessionSummary } from './auth.models';

export const SKIP_REFRESH = new HttpContextToken(() => false);

@Injectable({ providedIn: 'root' })
export class AuthClient {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly state = signal<Record<Application, AuthSession | null>>({
    user: null,
    admin: null,
  });
  readonly sessions = this.state.asReadonly();
  readonly expired = signal<{ application: Application; reason: string } | null>(null);
  private readonly renewing = new Map<Application, Promise<AuthSession>>();
  private readonly restoring = new Map<Application, Promise<AuthSession | null>>();

  configuration() {
    return firstValueFrom(this.http.get<{ googleConfigured: boolean }>('/api/auth/config'));
  }

  restore(application: Application): Promise<AuthSession | null> {
    const pending = this.restoring.get(application);
    if (pending) return pending;
    const request = firstValueFrom(this.http.get<AuthSession>(`/api/auth/${application}/session`))
      .then((session) => this.remember(application, session))
      .catch((error: unknown) => {
        this.forget(application);
        if (error instanceof HttpErrorResponse && error.status === 401) return null;
        throw error;
      })
      .finally(() => this.restoring.delete(application));
    this.restoring.set(application, request);
    return request;
  }

  refresh(application: Application): Promise<AuthSession> {
    const pending = this.renewing.get(application);
    if (pending) return pending;
    const renew = async () => {
      // Another tab may already have rotated the shared HttpOnly cookies.
      try {
        return await firstValueFrom(
          this.http.get<AuthSession>(`/api/auth/${application}/session`, {
            context: new HttpContext().set(SKIP_REFRESH, true),
          }),
        );
      } catch (error) {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) throw error;
      }
      return firstValueFrom(this.http.post<AuthSession>(`/api/auth/${application}/refresh`, {}));
    };
    const locks = this.document.defaultView?.navigator.locks;
    const operation = Promise.resolve(
      locks ? locks.request(`mapreko-refresh-${application}`, renew) : renew(),
    );
    const request = operation
      .then((session) => this.remember(application, session))
      .catch((error: unknown) => {
        if (error instanceof HttpErrorResponse && [401, 403].includes(error.status)) {
          this.forget(application);
          this.expired.set({
            application,
            reason: error.status === 403 ? 'access_denied' : 'session_expired',
          });
        }
        throw error;
      })
      .finally(() => this.renewing.delete(application));
    this.renewing.set(application, request);
    return request;
  }

  async logout(application: Application): Promise<void> {
    await firstValueFrom(this.http.post<void>(`/api/auth/${application}/logout`, {}));
    this.forget(application);
  }

  async updateProfile(application: Application, changes: ProfileUpdate): Promise<void> {
    const session = await firstValueFrom(
      this.http.patch<AuthSession>(`/api/auth/${application}/profile`, changes),
    );
    this.remember(application, session);
  }

  listSessions(application: Application) {
    return firstValueFrom(this.http.get<SessionSummary[]>(`/api/auth/${application}/sessions`));
  }

  async revoke(application: Application, id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`/api/auth/${application}/sessions/${id}`));
    if (this.state()[application]?.id === id) this.forget(application);
  }

  forget(application: Application): void {
    this.state.update((sessions) => ({ ...sessions, [application]: null }));
  }

  private remember(application: Application, session: AuthSession): AuthSession {
    this.state.update((sessions) => ({ ...sessions, [application]: session }));
    if (this.expired()?.application === application) this.expired.set(null);
    return session;
  }

  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0 || error.status >= 500)
        return 'No pudimos conectar con MAPREKO. Intenta de nuevo.';
      if (error.status === 401) return 'Tu sesion ha terminado. Inicia sesion nuevamente.';
      if (error.status === 403) return 'Tu cuenta no tiene acceso o esta inactiva.';
      if (error.status === 429) return 'Demasiados intentos. Espera un minuto antes de continuar.';
      if (error.status === 400) return 'Revisa los datos ingresados antes de guardar.';
    }
    this.errorHandler.handleError(error);
    return 'No pudimos completar la accion. Intenta de nuevo.';
  }
}
