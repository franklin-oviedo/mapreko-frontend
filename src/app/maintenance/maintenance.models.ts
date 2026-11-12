import type { TaskPriority } from '../dashboard/dashboard.models';

export interface MaintenanceProperty {
  id: string;
  name: string;
}
export interface MaintenancePlan {
  id: string;
  workspaceId: string;
  propertyId: string;
  propertyName: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  recurrenceUnit: 'day' | 'week' | 'month' | 'year';
  recurrenceInterval: number;
  startsOn: string;
  nextDueAt: string;
  timeZone: string;
  estimatedMinutes: number | null;
  status: 'active' | 'paused';
  canWrite: boolean;
  tasks: { title: string; instructions: string | null }[];
}
export interface MaintenanceActivity {
  id: string;
  propertyId: string;
  propertyName: string;
  title: string;
  dueAt: string;
  timeZone: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: TaskPriority;
  planId: string | null;
  planTitle: string | null;
  description: string | null;
  canWrite: boolean;
  assignees: { id: string; name: string }[];
  tasks: { id: string; title: string; instructions: string | null; completed: boolean }[];
}
export interface MaintenanceResponse {
  month: string;
  properties: MaintenanceProperty[];
  plans: MaintenancePlan[];
  activities: MaintenanceActivity[];
  metrics: { active: number; paused: number; dueThisMonth: number; completedThisMonth: number };
}
export interface CreatePlan {
  propertyId: string;
  title: string;
  description: string;
  taskTitle: string;
  instructions: string;
  priority: TaskPriority;
  recurrenceUnit: MaintenancePlan['recurrenceUnit'];
  recurrenceInterval: number;
  startsOn: string;
  firstDueOn: string;
  estimatedMinutes?: number;
}
export interface KnowledgeArticleCard {
  slug: string;
  category: { slug: string; name: string };
  title: string;
  summary: string;
  readMinutes: number;
}
export interface KnowledgeArticle extends KnowledgeArticleCard {
  content: string[];
  safety: string;
}
export interface KnowledgeResponse {
  categories: { slug: string; name: string }[];
  articles: KnowledgeArticleCard[];
}
