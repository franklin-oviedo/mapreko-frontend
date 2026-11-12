import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthClient } from './auth-client';
import { authInterceptor } from './auth.interceptor';
import { testSession } from './auth.test-fixtures';

describe('AuthClient', () => {
  let auth: AuthClient;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthClient);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('deduplicates concurrent renewal and sends no readable token to the client', async () => {
    const first = auth.refresh('user');
    const second = auth.refresh('user');
    http.expectOne('/api/auth/user/session').flush({}, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    const refresh = http.expectOne('/api/auth/user/refresh');
    expect(refresh.request.headers.get('X-Mapreko-Request')).toBe('1');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush(testSession);
    expect(await first).toEqual(testSession);
    expect(await second).toEqual(testSession);
    expect(auth.sessions().user?.user.givenName).toBe('Ana');
  });

  it('restores by cookie, refreshes expired access and clears only the logged-out application', async () => {
    const restore = auth.restore('user');
    http.expectOne('/api/auth/user/session').flush(testSession);
    await restore;
    const adminRestore = auth.restore('admin');
    http.expectOne('/api/auth/admin/session').flush({ ...testSession, application: 'admin' });
    await adminRestore;
    const logout = auth.logout('user');
    http.expectOne('/api/auth/user/logout').flush(null);
    await logout;
    expect(auth.sessions().user).toBeNull();
    expect(auth.sessions().admin?.application).toBe('admin');
  });

  it('does not silently clear the session if logout fails', async () => {
    const restore = auth.restore('user');
    http.expectOne('/api/auth/user/session').flush(testSession);
    await restore;
    const logout = auth.logout('user');
    const rejection = expect(logout).rejects.toMatchObject({ status: 503 });
    http.expectOne('/api/auth/user/logout').flush({}, { status: 503, statusText: 'Unavailable' });
    await rejection;
    expect(auth.sessions().user).toEqual(testSession);
  });

  it('renews expired cookies for dashboard calls before retrying them', async () => {
    const result = firstValueFrom(TestBed.inject(HttpClient).get('/api/dashboard/user/summary'));
    http
      .expectOne('/api/dashboard/user/summary')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    http.expectOne('/api/auth/user/session').flush(testSession);
    const retry = await vi.waitFor(() => http.expectOne('/api/dashboard/user/summary'));
    expect(retry.request.withCredentials).toBe(true);
    retry.flush({ ready: true });
    expect(await result).toEqual({ ready: true });
  });
});
