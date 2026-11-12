import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import axe from 'axe-core';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import type { DashboardSummary } from '../dashboard/dashboard.models';
import { PropertiesPage } from './properties-page';

const summary: DashboardSummary = {
  generatedAt: '2026-11-11T12:00:00Z',
  timeZone: 'UTC',
  properties: [
    {
      id: 'property-one',
      workspaceId: 'workspace-one',
      name: 'Mi casa',
      kind: 'house',
      timeZone: 'UTC',
      canCreateTask: true,
      preventiveTotal: 2,
      preventiveCompleted: 0,
    },
  ],
  tasks: [],
  metrics: {
    propertyCount: 1,
    buildingCount: 0,
    housingCount: 1,
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

describe('PropertiesPage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PropertiesPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthClient,
          useValue: {
            sessions: signal({
              user: {
                ...testSession,
                workspaces: [
                  { id: 'workspace-one', name: 'Mi espacio', kind: 'personal', role: 'owner' },
                ],
              },
              admin: null,
            }),
            errorMessage: () => 'No pudimos conectar con MAPREKO.',
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('shows a real zero-percent property and filters it by kind', async () => {
    const fixture = TestBed.createComponent(PropertiesPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    request.flush(summary);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('0%');
    expect((await axe.run(fixture.nativeElement)).violations).toEqual([]);
    fixture.componentInstance.filter.set('apartment');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No encontramos propiedades con esos filtros.',
    );
    fixture.componentInstance.filter.set('house');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Mi casa');
  });
});
