import type { AuthSession } from './auth.models';

export const testSession: AuthSession = {
  id: 'session-one',
  application: 'user',
  expiresAt: '2030-01-01T00:00:00Z',
  user: {
    id: 'user-one',
    email: 'ana@example.test',
    emailVerified: true,
    givenName: 'Ana',
    familyName: null,
    displayName: null,
    avatarUrl: null,
    phone: null,
    locale: 'es',
    timeZone: 'UTC',
  },
  roles: ['user'],
  permissions: ['profile:update'],
  workspaces: [],
};
