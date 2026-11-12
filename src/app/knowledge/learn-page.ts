import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { combineLatest, of } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { DashboardClient } from '../dashboard/dashboard-client';
import { Icon } from '../shared/icon';
import { MaintenanceClient } from '../maintenance/maintenance-client';
import type { KnowledgeArticle, KnowledgeResponse } from '../maintenance/maintenance.models';

type ArticleState =
  | { status: 'loading' }
  | { status: 'ready'; article: KnowledgeArticle }
  | { status: 'error'; message: string };
type ListingState =
  | { status: 'loading' }
  | { status: 'ready'; data: KnowledgeResponse }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-learn-page',
  host: { class: 'workspace-page' },
  imports: [Icon, RouterLink],
  templateUrl: './learn-page.html',
  styleUrl: './learn-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearnPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(MaintenanceClient);
  readonly dashboard = inject(DashboardClient);
  readonly category = signal('');
  private readonly refreshVersion = signal(0);
  private readonly guidesHeading = viewChild<ElementRef<HTMLHeadingElement>>('guidesHeading');
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly slug = computed(() => this.routeParams().get('slug') ?? '');
  readonly listing = toSignal(
    combineLatest([
      toObservable(this.dashboard.search),
      toObservable(this.category),
      toObservable(this.refreshVersion),
    ]).pipe(
      debounceTime(180),
      switchMap(([search, category]) =>
        this.api.articles(search.trim(), category).pipe(
          map((data): ListingState => ({ status: 'ready', data })),
          catchError((error: unknown) =>
            of<ListingState>({ status: 'error', message: this.api.errorMessage(error) }),
          ),
          startWith<ListingState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies ListingState },
  );
  readonly articleState = toSignal(
    toObservable(this.slug).pipe(
      switchMap((slug) =>
        slug
          ? this.api.article(slug).pipe(
              map((article): ArticleState => ({ status: 'ready', article })),
              catchError((error: unknown) =>
                of<ArticleState>({ status: 'error', message: this.api.errorMessage(error) }),
              ),
              startWith<ArticleState>({ status: 'loading' }),
            )
          : of<ArticleState>({ status: 'loading' }),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies ArticleState },
  );
  readonly categories = computed(() => {
    const state = this.listing();
    return state.status === 'ready' ? state.data.categories : [];
  });
  readonly articles = computed(() => {
    const state = this.listing();
    return state.status === 'ready' ? state.data.articles : [];
  });

  openArticle(slug: string): void {
    void this.router.navigate(['/app/learn', slug]);
  }
  backToList(): void {
    void this.router.navigate(['/app/learn']);
  }
  clearSearch(): void {
    this.dashboard.search.set('');
    this.category.set('');
    this.refreshVersion.update((value) => value + 1);
  }
  explore(): void {
    const heading = this.guidesHeading()?.nativeElement;
    heading?.scrollIntoView({ block: 'start' });
    heading?.focus();
  }
  categoryIcon(slug: string): 'water' | 'wind' | 'shield' | 'tool' | 'leaf' | 'book' {
    switch (slug) {
      case 'plomeria':
        return 'water';
      case 'climatizacion':
        return 'wind';
      case 'seguridad':
        return 'shield';
      case 'equipos':
        return 'tool';
      case 'exterior':
        return 'leaf';
      default:
        return 'book';
    }
  }
}
