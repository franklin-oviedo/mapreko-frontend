import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import type { DashboardProperty } from '../dashboard/dashboard.models';
import { MaintenanceClient } from './maintenance-client';
import { PlanDialog } from './plan-dialog';

describe('PlanDialog', () => {
  const createPlan = vi.fn();
  const properties: DashboardProperty[] = [
    {
      id: 'property-id',
      workspaceId: 'workspace-id',
      name: 'Mi casa',
      kind: 'house',
      timeZone: 'America/Santo_Domingo',
      canCreateTask: true,
      preventiveTotal: 0,
      preventiveCompleted: 0,
    },
  ];
  beforeEach(() => {
    createPlan.mockReset();
    TestBed.configureTestingModule({
      imports: [PlanDialog],
      providers: [
        { provide: AuthClient, useValue: { sessions: signal({ user: testSession, admin: null }) } },
        {
          provide: MaintenanceClient,
          useValue: {
            createPlan,
            errorMessage: () => 'No pudimos guardar el plan.',
          },
        },
      ],
    });
  });
  function setup() {
    const fixture = TestBed.createComponent(PlanDialog);
    fixture.componentRef.setInput('properties', properties);
    fixture.detectChanges();
    return fixture;
  }
  it('rejects a first date before the start date without sending a mutation', async () => {
    const fixture = setup();
    fixture.componentInstance.form.setValue({
      propertyId: 'property-id',
      title: 'Revisar filtros',
      taskTitle: 'Limpiar el filtro',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      startsOn: '2026-11-14',
      firstDueOn: '2026-11-13',
      priority: 'medium',
      description: '',
      instructions: '',
    });

    await fixture.componentInstance.save();

    expect(createPlan).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('no puede ser anterior');
  });
  it('keeps API failures visible and does not report a successful save', async () => {
    const fixture = setup();
    const created = vi.fn();
    fixture.componentInstance.created.subscribe(created);
    createPlan.mockRejectedValue(new Error('Unavailable'));
    fixture.componentInstance.form.setValue({
      propertyId: 'property-id',
      title: ' Revisar filtros ',
      taskTitle: ' Limpiar el filtro ',
      recurrenceUnit: 'month',
      recurrenceInterval: 1,
      startsOn: '2026-11-13',
      firstDueOn: '2026-11-13',
      priority: 'medium',
      description: '',
      instructions: '',
    });

    await fixture.componentInstance.save();

    expect(createPlan).toHaveBeenCalledOnce();
    expect(createPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Revisar filtros',
        taskTitle: 'Limpiar el filtro',
      }),
    );
    expect(created).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('No pudimos guardar');
    expect(fixture.componentInstance.busy()).toBe(false);
  });
});
