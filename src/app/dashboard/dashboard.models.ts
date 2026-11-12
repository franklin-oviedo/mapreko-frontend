export type PropertyKind = 'house' | 'apartment' | 'building' | 'commercial' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export interface DashboardProperty {
  id: string;
  workspaceId: string;
  name: string;
  kind: PropertyKind;
  timeZone: string;
  canCreateTask: boolean;
  preventiveTotal: number;
  preventiveCompleted: number;
}
export interface DashboardTask {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  description: string | null;
  dueAt: string;
  timeZone: string;
  priority: TaskPriority;
  status: 'pending' | 'in_progress';
}
export interface DashboardSummary {
  generatedAt: string;
  timeZone: string;
  properties: DashboardProperty[];
  tasks: DashboardTask[];
  metrics: {
    propertyCount: number;
    buildingCount: number;
    housingCount: number;
    otherCount: number;
    monthlyTasks: number;
    completedMonthly: number;
    overdue: number;
    highPriority: number;
    attentionCount: number;
    pendingTasks: number;
    compliance: number | null;
    complianceChange: number | null;
  };
}
export interface CreateTask {
  propertyId: string;
  title: string;
  description: string;
  dueOn: string;
  priority: TaskPriority;
}
export interface CreateProperty {
  workspaceId: string;
  name: string;
  kind: PropertyKind;
  address: string;
}
export type DashboardState =
  | { status: 'loading' }
  | {
      status: 'ready';
      data: DashboardSummary;
      query: { propertyId: string; search: string; version: number };
    }
  | { status: 'error'; message: string };
