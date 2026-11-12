import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { AuthClient } from '../auth/auth-client';
import { DashboardClient } from '../dashboard/dashboard-client';
import type {
  DashboardProperty,
  DashboardSummary,
  PropertyKind,
} from '../dashboard/dashboard.models';
import { CreateDialog } from '../dashboard/create-dialog';
import { Icon } from '../shared/icon';

type PropertiesState =
  | { status: 'loading' }
  | { status: 'ready'; data: DashboardSummary }
  | { status: 'error'; message: string };
type PropertyFilter = PropertyKind | 'all';

const kindLabels: Record<PropertyKind, string> = {
  house: 'Casa',
  apartment: 'Apartamento',
  building: 'Edificio residencial',
  commercial: 'Comercial',
  other: 'Otra propiedad',
};

@Component({
  selector: 'app-properties-page',
  host: { class: 'workspace-page' },
  imports: [CreateDialog, Icon],
  templateUrl: './properties-page.html',
  styleUrl: './properties-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPage {
  readonly client = inject(DashboardClient);
  private readonly auth = inject(AuthClient);
  readonly filter = signal<PropertyFilter>('all');
  readonly kindFilters: PropertyKind[] = ['house', 'apartment', 'building', 'commercial', 'other'];
  readonly refreshVersion = signal(0);
  readonly success = signal('');
  readonly focusAfterLoad = signal(false);
  readonly createDialog = viewChild.required(CreateDialog);
  private readonly heading = viewChild<ElementRef<HTMLHeadingElement>>('pageHeading');
  readonly state = toSignal(
    toObservable(this.refreshVersion).pipe(
      switchMap(() =>
        this.client.summary('', '').pipe(
          map((data): PropertiesState => ({ status: 'ready', data })),
          catchError((error: unknown) =>
            of<PropertiesState>({
              status: 'error',
              message: this.client.errorMessage(error),
            }),
          ),
          startWith<PropertiesState>({ status: 'loading' }),
        ),
      ),
    ),
    { initialValue: { status: 'loading' } satisfies PropertiesState },
  );
  readonly summary = computed(() => {
    const state = this.state();
    return state.status === 'ready' ? state.data : null;
  });
  readonly properties = computed(() => this.summary()?.properties ?? []);
  readonly visibleProperties = computed(() => {
    const query = this.client.search().trim().toLocaleLowerCase();
    const filter = this.filter();
    return this.properties().filter((property) => {
      const matchesKind = filter === 'all' || property.kind === filter;
      const matchesSearch =
        !query ||
        `${property.name} ${kindLabels[property.kind]} ${this.workspaceName(property.workspaceId)}`
          .toLocaleLowerCase()
          .includes(query);
      return matchesKind && matchesSearch;
    });
  });
  readonly canCreateProperty = computed(
    () =>
      this.auth
        .sessions()
        .user?.workspaces.some(
          (workspace) => workspace.role === 'owner' || workspace.role === 'admin',
        ) ?? false,
  );
  readonly counts = computed(() => {
    const properties = this.properties();
    return {
      all: properties.length,
      house: properties.filter((property) => property.kind === 'house').length,
      apartment: properties.filter((property) => property.kind === 'apartment').length,
      building: properties.filter((property) => property.kind === 'building').length,
      commercial: properties.filter((property) => property.kind === 'commercial').length,
      other: properties.filter((property) => property.kind === 'other').length,
    };
  });

  constructor() {
    afterRenderEffect(() => {
      if (this.focusAfterLoad() && this.state().status === 'ready') {
        this.heading()?.nativeElement.focus();
        this.focusAfterLoad.set(false);
      }
    });
  }
  kindLabel(kind: PropertyKind): string {
    return kindLabels[kind];
  }
  countForKind(kind: PropertyKind): number {
    return this.counts()[kind];
  }
  workspaceName(id: string): string {
    return (
      this.auth.sessions().user?.workspaces.find((workspace) => workspace.id === id)?.name ??
      'Mi espacio'
    );
  }
  completion(property: DashboardProperty): number | null {
    return property.preventiveTotal
      ? Math.round((100 * property.preventiveCompleted) / property.preventiveTotal)
      : null;
  }
  created(event: { kind: 'task' | 'property'; propertyId: string }): void {
    this.success.set(
      event.kind === 'property'
        ? 'Propiedad registrada. Ya aparece en tu espacio.'
        : 'Tarea creada y guardada correctamente.',
    );
    if (event.kind === 'property') {
      this.client.search.set('');
      this.filter.set('all');
    }
    this.focusAfterLoad.set(true);
    this.refreshVersion.update((version) => version + 1);
  }
  refresh(): void {
    this.refreshVersion.update((version) => version + 1);
  }
}
