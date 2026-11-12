import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthClient } from '../auth/auth-client';
import type { CreateProperty, CreateTask, DashboardSummary } from './dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardClient {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthClient);
  readonly search = signal('');

  summary(propertyId: string, search: string) {
    return this.http.get<DashboardSummary>('/api/dashboard/user/summary', {
      params: { ...(propertyId ? { propertyId } : {}), ...(search ? { search } : {}) },
    });
  }
  createTask(input: CreateTask) {
    return firstValueFrom(this.http.post<{ id: string }>('/api/dashboard/user/tasks', input));
  }
  createProperty(input: CreateProperty) {
    return firstValueFrom(this.http.post<{ id: string }>('/api/dashboard/user/properties', input));
  }
  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404)
      return 'La propiedad o el espacio ya no está disponible, o no tienes acceso.';
    return this.auth.errorMessage(error);
  }
}
