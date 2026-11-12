import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import axe from 'axe-core';
import { provideRouter } from '@angular/router';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import type { DashboardSummary } from '../dashboard/dashboard.models';
import { ReportsPage } from './reports-page';

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
    monthlyTasks: 3,
    completedMonthly: 0,
    overdue: 0,
    highPriority: 0,
    attentionCount: 0,
    pendingTasks: 3,
    compliance: 0,
    complianceChange: null,
  },
};

describe('ReportsPage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthClient,
          useValue: {
            sessions: signal({ user: testSession, admin: null }),
            errorMessage: () => 'No pudimos conectar con MAPREKO.',
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('renders zero completion as data rather than as an empty period', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    request.flush(summary);
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.completion-value')?.textContent).toContain('0%');
    expect(element.querySelectorAll('progress').length).toBe(2);
    expect(element.textContent).toContain('0 de 3 tareas del período completadas');
    expect(element.textContent).not.toContain('No hay tareas registradas para este período');
    expect((await axe.run(element)).violations).toEqual([]);
  });

  it('shows an explicit error and allows retry when report data cannot load', async () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent)
      .toContain('No pudimos conectar');
    fixture.componentInstance.refresh();
    fixture.detectChanges();
    const retry = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    retry.flush(summary);
    await fixture.whenStable();
    expect(fixture.componentInstance.state().status).toBe('ready');
  });
});
