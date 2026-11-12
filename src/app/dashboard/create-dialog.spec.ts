import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthClient } from '../auth/auth-client';
import { testSession } from '../auth/auth.test-fixtures';
import { CreateDialog } from './create-dialog';
import { DashboardClient } from './dashboard-client';

describe('CreateDialog', () => {
  const createTask = vi.fn();
  beforeEach(() => {
    createTask.mockReset();
    TestBed.configureTestingModule({
      imports: [CreateDialog],
      providers: [
        { provide: AuthClient, useValue: { sessions: signal({ user: testSession, admin: null }) } },
        {
          provide: DashboardClient,
          useValue: { createTask, errorMessage: () => 'No pudimos guardar la tarea.' },
        },
      ],
    });
  });
  function setup() {
    const fixture = TestBed.createComponent(CreateDialog);
    fixture.componentRef.setInput('properties', []);
    fixture.detectChanges();
    return fixture;
  }
  it('rejects whitespace-only titles without sending a mutation', async () => {
    const fixture = setup();
    fixture.componentInstance.taskForm.setValue({
      title: '   ',
      propertyId: 'property-one',
      dueOn: '2026-11-12',
      priority: 'medium',
      description: '',
    });
    await fixture.componentInstance.saveTask();
    expect(createTask).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('Revisa');
  });
  it('emits success only after persistence and blocks a duplicate submission', async () => {
    const fixture = setup();
    const saved = vi.fn();
    fixture.componentInstance.created.subscribe(saved);
    const element = fixture.nativeElement as HTMLElement;
    const dialog = element.querySelector('dialog');
    if (!dialog) throw new Error('Missing dialog');
    dialog.close = vi.fn();
    let resolve: ((result: { id: string }) => void) | undefined;
    createTask.mockReturnValue(
      new Promise<{ id: string }>((done) => {
        resolve = done;
      }),
    );
    fixture.componentInstance.taskForm.setValue({
      title: '  Revisar techo  ',
      propertyId: 'property-one',
      dueOn: '2026-11-12',
      priority: 'high',
      description: ' Detalles ',
    });
    const first = fixture.componentInstance.saveTask();
    await fixture.componentInstance.saveTask();
    expect(createTask).toHaveBeenCalledTimes(1);
    expect(saved).not.toHaveBeenCalled();
    expect(createTask).toHaveBeenCalledWith({
      title: 'Revisar techo',
      propertyId: 'property-one',
      dueOn: '2026-11-12',
      priority: 'high',
      description: 'Detalles',
    });
    if (!resolve) throw new Error('Missing persistence resolver');
    resolve({ id: 'saved-task' });
    await first;
    expect(saved).toHaveBeenCalledWith({ kind: 'task', propertyId: 'property-one' });
    expect(dialog.close).toHaveBeenCalledOnce();
  });
  it('keeps failures visible without emitting a successful creation', async () => {
    const fixture = setup();
    const saved = vi.fn();
    fixture.componentInstance.created.subscribe(saved);
    createTask.mockRejectedValue(new Error('Unavailable'));
    fixture.componentInstance.taskForm.setValue({
      title: 'Revisar techo',
      propertyId: 'property-one',
      dueOn: '2026-11-12',
      priority: 'high',
      description: '',
    });
    await fixture.componentInstance.saveTask();
    expect(saved).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('No pudimos guardar');
    expect(fixture.componentInstance.busy()).toBe(false);
  });
});
