import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DEMO_PAGES } from './app.routes';
import { ThemeService } from './core/theme.service';

/**
 * Application shell: sidebar navigation, header chrome and the router outlet.
 *
 * `CUSTOM_ELEMENTS_SCHEMA` is required on every component whose template
 * contains `<wa-*>` tags. Without it Angular's compiler rejects the unknown
 * elements. It relaxes template checking for *all* unknown tags in this
 * component, which is the trade-off for using custom elements.
 */
@Component({
  selector: 'aa-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly theme = inject(ThemeService);

  /** Pages listed in the sidebar. */
  protected readonly pages = DEMO_PAGES;

  /** Active colour scheme, for the theme toggle's icon and label. */
  protected readonly themeMode = this.theme.current;

  /** Flips between the light and dark palettes. */
  protected toggleTheme(): void {
    this.theme.toggle();
  }
}
