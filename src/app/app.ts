import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  constructor() {
    const document = inject(DOCUMENT);
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => event.urlAfterRedirects.split(/[?#]/)[0]),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        requestAnimationFrame(() =>
          document.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }),
        );
      });
  }
}
