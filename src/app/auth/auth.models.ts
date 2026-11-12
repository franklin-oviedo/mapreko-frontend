import { ActivatedRouteSnapshot } from '@angular/router';

export type Application = 'user' | 'admin';
export interface UserProfile {
  id: string;
  email: string;
  emailVerified: boolean;
  givenName: string | null;
  familyName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  locale: string;
  timeZone: string;
}
export interface AuthSession {
  id: string;
  application: Application;
  expiresAt: string;
  user: UserProfile;
  roles: string[];
  permissions: string[];
  workspaces: { id: string; name: string; kind: 'personal' | 'business'; role: string }[];
}
export interface SessionSummary {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  current: boolean;
}
export type ProfileUpdate = Pick<
  UserProfile,
  'givenName' | 'familyName' | 'displayName' | 'phone' | 'locale' | 'timeZone'
>;

export function routeApplication(route: ActivatedRouteSnapshot): Application {
  const application: unknown = route.data['application'];
  if (application !== 'user' && application !== 'admin') {
    throw new Error('La ruta requiere una aplicacion MAPREKO.');
  }
  return application;
}
