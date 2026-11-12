import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import axe from 'axe-core';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import { SummaryPage } from './summary-page';
import { DashboardClient } from './dashboard-client';
import type { DashboardSummary } from './dashboard.models';

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

describe('SummaryPage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SummaryPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: AuthClient,
          useValue: {
            sessions: signal({
              user: {
                ...testSession,
                workspaces: [
                  { id: 'workspace-one', name: 'Mi hogar', kind: 'personal', role: 'owner' },
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

  it('renders real empty indicators, not prototype numbers, and offers property registration', async () => {
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    request.flush(emptySummary);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Registrar mi primera propiedad');
    expect(element.querySelector('app-summary-metrics')?.textContent).toContain(
      'Sin tareas preventivas',
    );
    expect(element.querySelector('app-summary-metrics')?.textContent).not.toContain('86%');
    expect(element.querySelector<HTMLButtonElement>('.summary-actions button')?.disabled).toBe(
      true,
    );
  });

  it('shows a loading failure rather than a successful zero summary', async () => {
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No pudimos conectar');
    expect(element.querySelector('app-summary-metrics')).toBeNull();
    fixture.componentInstance.refresh();
    fixture.detectChanges();
    const retry = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    retry.flush(emptySummary);
    await fixture.whenStable();
    expect(fixture.componentInstance.state().status).toBe('ready');
  });

  it('keeps zero progress, declining compliance and priority review accessible in the populated layout', async () => {
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    request.flush({
      ...emptySummary,
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
        ...['Casa dos', 'Casa tres', 'Casa cuatro'].map((name, index) => ({
          id: `extra-property-${index}`,
          workspaceId: 'workspace-one',
          name,
          kind: 'house' as const,
          timeZone: 'UTC',
          canCreateTask: true,
          preventiveTotal: 2,
          preventiveCompleted: 0,
        })),
      ],
      tasks: [
        {
          id: 'overdue-task',
          propertyId: 'property-one',
          propertyName: 'Mi casa',
          title: 'Revisar el filtro',
          description: null,
          dueAt: '2026-11-09T23:59:59Z',
          timeZone: 'UTC',
          priority: 'high',
          status: 'pending',
        },
        {
          id: 'future-task',
          propertyId: 'property-one',
          propertyName: 'Mi casa',
          title: 'Revisar las ventanas',
          description: null,
          dueAt: '2026-11-13T23:59:59Z',
          timeZone: 'UTC',
          priority: 'medium',
          status: 'pending',
        },
        {
          id: 'today-task',
          propertyId: 'property-one',
          propertyName: 'Mi casa',
          title: 'Revisar el techo',
          description: null,
          dueAt: '2026-11-12T02:00:00Z',
          timeZone: 'America/Santo_Domingo',
          priority: 'medium',
          status: 'pending',
        },
        {
          id: 'fourth-task',
          propertyId: 'property-one',
          propertyName: 'Mi casa',
          title: 'Revisar la puerta',
          description: null,
          dueAt: '2026-11-15T23:59:59Z',
          timeZone: 'UTC',
          priority: 'medium',
          status: 'pending',
        },
      ],
      metrics: {
        ...emptySummary.metrics,
        propertyCount: 4,
        housingCount: 4,
        monthlyTasks: 4,
        pendingTasks: 4,
        overdue: 1,
        highPriority: 1,
        attentionCount: 1,
        compliance: 0,
        complianceChange: -12,
      },
    } satisfies DashboardSummary);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Todo bajo control, Ana');
    expect(element.querySelectorAll('app-property-health .property-name').length).toBe(3);
    expect(element.querySelector('app-property-health')?.textContent).not.toContain('Casa cuatro');
    expect(element.querySelectorAll('app-summary-tasks .task-row').length).toBe(3);
    expect(element.querySelector('.task-due.today')?.textContent).toContain('Hoy · 11');
    expect(element.querySelector('.property-value')?.textContent).toContain('0%');
    expect(element.querySelector<HTMLProgressElement>('app-property-health progress')?.value).toBe(
      0,
    );
    expect(element.querySelector('.change-value.negative')?.textContent).toContain('-12');
    expect((await axe.run(element)).violations).toEqual([]);
    element.querySelector<HTMLButtonElement>('app-summary-tasks .inline-link')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelectorAll('app-summary-tasks .task-row').length).toBe(4);
    element.querySelector<HTMLButtonElement>('.banner-link')?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(element.querySelectorAll('app-summary-tasks .task-row').length).toBe(1);
    expect(element.querySelector('app-summary-tasks .task-row')?.textContent).toContain(
      'Revisar el filtro',
    );
    expect(element.ownerDocument.activeElement).toBe(element.querySelector('#next-step-title'));
  });

  it('debounces coherent property/search filters and discards stale responses', async () => {
    const fixture = TestBed.createComponent(SummaryPage);
    fixture.detectChanges();
    const stale = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    fixture.componentInstance.propertyId.set('property-one');
    TestBed.inject(DashboardClient).search.set('  filtro  ');
    fixture.detectChanges();
    const filtered = await vi.waitFor(() =>
      http.expectOne(
        (request) =>
          request.url === '/api/dashboard/user/summary' &&
          request.params.get('propertyId') === 'property-one' &&
          request.params.get('search') === 'filtro',
      ),
    );
    expect(stale.cancelled).toBe(true);
    filtered.flush(emptySummary);
    await fixture.whenStable();
    expect(fixture.componentInstance.summary()).toEqual(emptySummary);
  });
});
