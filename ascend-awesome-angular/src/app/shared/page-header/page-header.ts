import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

/**
 * Heading block shown at the top of every demo page.
 *
 * Renders the page title, a one-line summary and a list of the Web Awesome
 * components the page exercises.
 */
@Component({
  selector: 'aa-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <header class="page-header">
      <h1 class="page-header__title">{{ title() }}</h1>
      <p class="page-header__summary">{{ summary() }}</p>
      @if (components().length) {
        <div class="page-header__tags">
          @for (component of components(); track component) {
            <wa-tag size="small" appearance="outlined">{{ component }}</wa-tag>
          }
        </div>
      }
    </header>
  `,
  styleUrl: './page-header.scss',
})
export class PageHeader {
  /** Page title. */
  readonly title = input.required<string>();

  /** One-line description of what the page demonstrates. */
  readonly summary = input.required<string>();

  /** Tag names of the components shown on the page, e.g. `wa-input`. */
  readonly components = input<readonly string[]>([]);
}
