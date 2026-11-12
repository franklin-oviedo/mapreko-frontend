import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import type { DashboardSummary } from '../dashboard/dashboard.models';
import type { MaintenanceActivity, MaintenanceResponse } from './maintenance.models';
import axe from 'axe-core';
import { MaintenancePage } from './maintenance-page';

const summary: DashboardSummary = {
  generatedAt: '2026-11-11T12:00:00Z',
  timeZone: 'America/Santo_Domingo',
  properties: [
    {
      id: 'property-one',
      workspaceId: 'workspace-one',
      name: 'Mi casa',
      kind: 'house',
      timeZone: 'America/Santo_Domingo',
      canCreateTask: true,
      preventiveTotal: 1,
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
const plans: MaintenanceResponse = {
  month: '2026-11',
  properties: [{ id: 'property-one', name: 'Mi casa' }],
  plans: [
    {
      id: 'plan-one',
      workspaceId: 'workspace-one',
      propertyId: 'property-one',
      propertyName: 'Mi casa',
      title: 'Revisión preventiva',
      description: null,
      priority: 'medium',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      startsOn: '2026-11-11',
      nextDueAt: '2026-11-13T03:59:59.999Z',
      timeZone: 'America/Santo_Domingo',
      estimatedMinutes: null,
      status: 'active',
      canWrite: true,
      tasks: [{ title: 'Revisar el filtro', instructions: null }],
    },
  ],
  activities: [],
  metrics: { active: 1, paused: 0, dueThisMonth: 1, completedThisMonth: 0 },
};

describe('MaintenancePage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MaintenancePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
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

  it('loads property permissions and plans, then renders the active plan', async () => {
    const fixture = TestBed.createComponent(MaintenancePage);
    fixture.componentInstance.mode.set('plans');
    fixture.detectChanges();

    const plansRequest = await vi.waitFor(() =>
      http.expectOne((request) => request.url === '/api/maintenance/user/plans'),
    );
    const summaryRequest = http.expectOne('/api/dashboard/user/summary');
    expect(plansRequest.request.params.get('month')).toMatch(/^\d{4}-\d{2}$/);

    plansRequest.flush(plans);
    summaryRequest.flush(summary);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.state().status).toBe('ready');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Revisión preventiva');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cada 1 mes');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
        '.page-heading button',
      )?.disabled,
    ).toBe(false);
  });

  it('shows a visible error instead of empty metrics when plan loading fails', async () => {
    const fixture = TestBed.createComponent(MaintenancePage);
    fixture.componentInstance.mode.set('plans');
    fixture.detectChanges();

    const plansRequest = await vi.waitFor(() =>
      http.expectOne((request) => request.url === '/api/maintenance/user/plans'),
    );
    const summaryRequest = http.expectOne('/api/dashboard/user/summary');
    summaryRequest.flush(summary);
    plansRequest.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.state().status).toBe('error');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain('No pudimos conectar');
    expect((fixture.nativeElement as HTMLElement).querySelector('.plan-metrics')).toBeNull();
  });

  it('renders the weekly list with task details and persists completion before refreshing', async () => {
    const activity: MaintenanceActivity = {
      id: 'activity-one',
      propertyId: 'property-one',
      propertyName: 'Mi casa',
      title: 'Limpiar el filtro',
      dueAt: '2026-11-11T23:59:59Z',
      timeZone: 'UTC',
      status: 'pending',
      priority: 'medium',
      planId: 'plan-one',
      planTitle: 'Revisión preventiva',
      description: 'Consultar las instrucciones del fabricante.',
      canWrite: true,
      assignees: [],
      tasks: [{ id: 'step-one', title: 'Revisar el filtro', instructions: null, completed: false }],
    };
    const fixture = TestBed.createComponent(MaintenancePage);
    fixture.componentInstance.selectedDate.set('2026-11-11');
    fixture.componentInstance.month.set('2026-11');
    fixture.detectChanges();
    const plansRequest = await vi.waitFor(() =>
      http.expectOne((request) => request.url === '/api/maintenance/user/plans'),
    );
    http.expectOne('/api/dashboard/user/summary').flush(summary);
    const completedActivity: MaintenanceActivity = {
      ...activity,
      id: 'activity-completed',
      status: 'completed',
    };
    plansRequest.flush({ ...plans, activities: [activity, completedActivity] });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.week-strip button').length).toBe(7);
    expect(element.querySelector('.task-detail')?.textContent).toContain('Sin asignar');
    expect(element.querySelector('.task-detail')?.textContent).toContain('Cada 1 mes');
    expect((await axe.run(element)).violations).toEqual([]);
    fixture.componentInstance.setStatusFilter('pending');
    fixture.componentInstance.setTaskTab('completed');
    expect(fixture.componentInstance.shownActivities()).toEqual([completedActivity]);
    fixture.componentInstance.setStatusFilter('completed');
    fixture.componentInstance.setTaskTab('pending');
    expect(fixture.componentInstance.shownActivities()).toEqual([activity]);
    const completing = fixture.componentInstance.complete(activity);
    const write = http.expectOne('/api/maintenance/user/activities/activity-one/complete');
    expect(fixture.componentInstance.success()).toBe('');
    write.flush({ id: activity.id, status: 'completed' });
    await completing;
    fixture.detectChanges();
    const refresh = await vi.waitFor(() =>
      http.expectOne((request) => request.url === '/api/maintenance/user/plans'),
    );
    http.expectOne('/api/dashboard/user/summary').flush(summary);
    refresh.flush({
      ...plans,
      activities: [{ ...activity, status: 'completed' }, completedActivity],
    });
    await fixture.whenStable();
    expect(fixture.componentInstance.completedActivities().length).toBe(2);
    expect(fixture.componentInstance.pendingActivities().length).toBe(0);
  });

  it('loads both months for a week that crosses the monthly boundary', async () => {
    const fixture = TestBed.createComponent(MaintenancePage);
    fixture.componentInstance.selectedDate.set('2026-12-01');
    fixture.componentInstance.month.set('2026-12');
    fixture.detectChanges();
    const december = await vi.waitFor(() =>
      http.expectOne(
        (request) =>
          request.url === '/api/maintenance/user/plans' &&
          request.params.get('month') === '2026-12',
      ),
    );
    const november = http.expectOne(
      (request) =>
        request.url === '/api/maintenance/user/plans' && request.params.get('month') === '2026-11',
    );
    http.expectOne('/api/dashboard/user/summary').flush(summary);
    december.flush({ ...plans, month: '2026-12' });
    november.flush(plans);
    await fixture.whenStable();
    expect(fixture.componentInstance.weekDays().map((day) => day.key)).toEqual([
      '2026-11-30',
      '2026-12-01',
      '2026-12-02',
      '2026-12-03',
      '2026-12-04',
      '2026-12-05',
      '2026-12-06',
    ]);
  });
});
