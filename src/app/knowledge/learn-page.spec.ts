import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import axe from 'axe-core';
import { LearnPage } from './learn-page';
import type { KnowledgeResponse } from '../maintenance/maintenance.models';

const guides: KnowledgeResponse = {
  categories: [{ slug: 'plomeria', name: 'Plomería' }],
  articles: [
    {
      slug: 'detectar-filtraciones',
      category: { slug: 'plomeria', name: 'Plomería' },
      title: 'Detectar filtraciones',
      summary: 'Observa señales tempranas sin exponerte a riesgos.',
      readMinutes: 4,
    },
  ],
};

describe('LearnPage', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LearnPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('renders the prototype structure with accessible category controls and real guides', async () => {
    const fixture = TestBed.createComponent(LearnPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/maintenance/user/articles'));
    request.flush(guides);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain('Aprende. Hazlo con confianza.');
    expect(element.querySelector('.learn-hero')?.textContent).toContain(
      'Un hogar cuidado empieza contigo.',
    );
    expect(element.querySelector('.article-cover')).not.toBeNull();
    expect((await axe.run(element)).violations).toEqual([]);
    fixture.componentInstance.category.set('plomeria');
    fixture.detectChanges();
    const filtered = await vi.waitFor(() =>
      http.expectOne(
        (request) =>
          request.url === '/api/maintenance/user/articles' &&
          request.params.get('category') === 'plomeria',
      ),
    );
    filtered.flush(guides);
    await fixture.whenStable();
  });

  it('retries a failed initial request even when the filters are already empty', async () => {
    const fixture = TestBed.createComponent(LearnPage);
    fixture.detectChanges();
    const request = await vi.waitFor(() => http.expectOne('/api/maintenance/user/articles'));
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    await fixture.whenStable();
    fixture.componentInstance.clearSearch();
    fixture.detectChanges();
    const retry = await vi.waitFor(() => http.expectOne('/api/maintenance/user/articles'));
    retry.flush(guides);
    await fixture.whenStable();
    expect(fixture.componentInstance.listing().status).toBe('ready');
  });
});
