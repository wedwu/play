import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Titled container for a group of component examples.
 *
 * Each demo page is a stack of these: a heading, an optional note explaining
 * what the group illustrates, and projected content holding the live
 * components.
 *
 * @example
 * ```html
 * <aa-demo-section heading="Buttons" note="Variants and sizes.">
 *   <wa-button variant="brand">Save</wa-button>
 * </aa-demo-section>
 * ```
 */
@Component({
  selector: 'aa-demo-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="demo-section">
      <header class="demo-section__header">
        <h2 class="demo-section__heading">{{ heading() }}</h2>
        @if (note()) {
          <p class="demo-section__note">{{ note() }}</p>
        }
      </header>
      <div class="demo-section__body" [class.demo-section__body--stack]="stack()">
        <ng-content />
      </div>
    </section>
  `,
  styleUrl: './demo-section.scss',
})
export class DemoSection {
  /** Section heading rendered above the examples. */
  readonly heading = input.required<string>();

  /** Optional explanatory line shown under the heading. */
  readonly note = input<string>('');

  /**
   * Lays examples out vertically instead of wrapping them in a row.
   *
   * Useful for full-width components such as inputs or progress bars.
   */
  readonly stack = input<boolean>(false);
}
