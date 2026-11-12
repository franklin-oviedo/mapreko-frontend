import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthClient } from '../auth/auth-client';
import type {
  CreatePlan,
  KnowledgeArticle,
  KnowledgeResponse,
  MaintenanceResponse,
} from './maintenance.models';

@Injectable({ providedIn: 'root' })
export class MaintenanceClient {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthClient);
  plans(month: string, propertyId: string) {
    return this.http.get<MaintenanceResponse>('/api/maintenance/user/plans', {
      params: { month, ...(propertyId ? { propertyId } : {}) },
    });
  }
  createPlan(plan: CreatePlan) {
    return firstValueFrom(this.http.post<{ id: string }>('/api/maintenance/user/plans', plan));
  }
  setPlanStatus(id: string, status: 'active' | 'paused') {
    return firstValueFrom(
      this.http.patch('/api/maintenance/user/plans/' + encodeURIComponent(id) + '/status', {
        status,
      }),
    );
  }
  completeActivity(id: string) {
    return firstValueFrom(
      this.http.post<{ id: string; status: 'completed' }>(
        '/api/maintenance/user/activities/' + encodeURIComponent(id) + '/complete',
        {},
      ),
    );
  }
  articles(search: string, category: string) {
    return this.http.get<KnowledgeResponse>('/api/maintenance/user/articles', {
      params: { ...(search ? { search } : {}), ...(category ? { category } : {}) },
    });
  }
  article(slug: string) {
    return this.http.get<KnowledgeArticle>(
      '/api/maintenance/user/articles/' + encodeURIComponent(slug),
    );
  }
  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 404)
      return 'El contenido o recurso ya no está disponible, o no tienes acceso.';
    return this.auth.errorMessage(error);
  }
}
