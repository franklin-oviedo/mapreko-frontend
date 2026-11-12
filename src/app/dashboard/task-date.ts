import type { DashboardTask } from './dashboard.models';

export function isOverdue(task: DashboardTask, now: string): boolean {
  return new Date(task.dueAt).getTime() < new Date(now).getTime();
}

export function isDueToday(task: DashboardTask, now: string): boolean {
  const day = new Intl.DateTimeFormat('en', { dateStyle: 'short', timeZone: task.timeZone });
  return !isOverdue(task, now) && day.format(new Date(now)) === day.format(new Date(task.dueAt));
}

export function taskDueLabel(task: DashboardTask, now: string): string {
  const due = new Date(task.dueAt);
  const format = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    timeZone: task.timeZone,
  });
  const prefix = isOverdue(task, now) ? 'Vencida · ' : isDueToday(task, now) ? 'Hoy · ' : '';
  return prefix + format.format(due);
}
