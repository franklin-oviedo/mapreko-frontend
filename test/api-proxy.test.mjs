import assert from 'node:assert/strict';
import { test } from 'node:test';
import { onRequest } from '../functions/api/_middleware.ts';

test('preserves OAuth redirects and cookies instead of following them at the edge', async (t) => {
  const response = new Response(null, {
    status: 302,
    headers: {
      Location: 'https://accounts.google.com/o/oauth2/v2/auth',
      'Set-Cookie': 'mapreko_oauth_flow=flow; HttpOnly; Secure; SameSite=Lax',
    },
  });
  const fetch = t.mock.method(globalThis, 'fetch', async (request, options) => {
    assert.equal(request.url, 'https://api.example.com/api/auth/google/start/user');
    assert.equal(options.redirect, 'manual');
    return response;
  });

  const result = await onRequest({
    request: new Request('https://app.example.com/api/auth/google/start/user'),
    env: { API_ORIGIN: 'https://api.example.com' },
  });

  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(result.status, 302);
  assert.equal(result.headers.get('Location'), response.headers.get('Location'));
  assert.equal(result.headers.get('Set-Cookie'), response.headers.get('Set-Cookie'));
});

test('preserves authenticated request bodies, headers and query parameters', async (t) => {
  t.mock.method(globalThis, 'fetch', async (request) => {
    assert.equal(request.url, 'https://api.example.com/api/auth/user/profile?locale=es');
    assert.equal(request.method, 'PATCH');
    assert.equal(request.headers.get('Origin'), 'https://app.example.com');
    assert.equal(request.headers.get('Cookie'), 'mapreko_user_access=session');
    assert.equal(request.headers.get('X-Mapreko-Request'), '1');
    assert.deepEqual(await request.json(), { displayName: 'Mi perfil' });
    return new Response(null, { status: 204 });
  });

  const result = await onRequest({
    request: new Request('https://app.example.com/api/auth/user/profile?locale=es', {
      method: 'PATCH',
      headers: {
        Origin: 'https://app.example.com',
        Cookie: 'mapreko_user_access=session',
        'X-Mapreko-Request': '1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ displayName: 'Mi perfil' }),
    }),
    env: { API_ORIGIN: 'https://api.example.com' },
  });

  assert.equal(result.status, 204);
});
