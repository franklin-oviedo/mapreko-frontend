import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, Icon],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage {}
