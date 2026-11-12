import { taskDueLabel } from './task-date';
import type { DashboardTask } from './dashboard.models';

describe('Task deadline labels', () => {
  it('uses the property day across UTC midnight and marks actual overdue deadlines', () => {
    const task: DashboardTask = {
      id: 'one',
      propertyId: 'one',
      propertyName: 'Mi hogar',
      title: 'Revisar',
      description: null,
      dueAt: '2026-11-12T03:59:59.999Z',
      timeZone: 'America/Santo_Domingo',
      priority: 'medium',
      status: 'pending',
    };
    expect(taskDueLabel(task, '2026-11-12T02:00:00Z')).toContain('Hoy · 11');
    expect(taskDueLabel(task, '2026-11-12T04:00:00Z')).toContain('Vencida · 11');
  });
});
