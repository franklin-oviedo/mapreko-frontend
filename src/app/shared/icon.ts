import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const paths = {
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  home: 'm3 10 9-7 9 7 M5 9v12h14V9 M9 21v-8h6v8',
  building: 'M4 21V5l8-3 8 3v16 M8 8h1 M15 8h1 M8 12h1 M15 12h1 M8 16h1 M15 16h1 M10 21v-3h4v3',
  water: 'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12Z M8 15a4 4 0 0 0 4 4',
  wind: 'M3 8h12a3 3 0 1 0-3-3 M3 12h16a3 3 0 1 1-3 3 M3 16h5a3 3 0 1 1-3 3',
  shield: 'm12 3 8 3v6c0 5-5 8-8 10-3-2-8-5-8-10V6z M8 12l3 3 5-6',
  tool: 'M14 6a5 5 0 0 0-6 6L3 17a3 3 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-4 3-3-3z',
  calendar: 'M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h3 M8 17h6',
  book: 'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-4-2-7-1-10 1Zm0 0v15',
  chart: 'M4 3v18h17 M8 16v-5 M13 16V7 M18 16V4',
  settings:
    'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  help: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5 M12 17v.1',
  search: 'M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0 M15 15l6 6',
  plus: 'M12 5v14 M5 12h14',
  arrow: 'M4 12h16 M14 6l6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  check: 'm5 12 4 4L19 6',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  alert: 'm12 3 10 18H2z M12 9v5 M12 17v.1',
  close: 'm6 6 12 12 M6 18 18 6',
  leaf: 'M20 3C8 2 3 8 6 15c7 5 15-1 14-12Z M4 21l11-12 M8 16v-5 M12 12h5',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
  logout: 'M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4',
};

@Component({
  selector: 'app-icon',
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path [attr.d]="paths[name()]" />
  </svg>`,
  styles: `
    :host {
      display: inline-flex;
      width: 1.15rem;
      height: 1.15rem;
      flex-shrink: 0;
      vertical-align: middle;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly name = input<keyof typeof paths>('home');
  protected readonly paths = paths;
}
