import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { DemoSection } from '../../shared/demo-section/demo-section';
import { PageHeader } from '../../shared/page-header/page-header';

/**
 * Navigation and layout page.
 *
 * Tabs, accordions, breadcrumbs, dropdowns, pagination and split panels.
 * Custom-element events carry their payload on `event.detail`, so handlers
 * here read from the event rather than from a two-way binding.
 */
@Component({
  selector: 'aa-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [DemoSection, PageHeader],
  templateUrl: './navigation-page.html',
  styleUrl: './navigation-page.scss',
})
export class NavigationPage {
  /** Current page in the pagination example. */
  protected readonly currentPage = signal(3);

  /** Label of the most recently selected dropdown item. */
  protected readonly lastSelection = signal('none');

  /**
   * Reads the new page number from a `wa-pagination` change event.
   *
   * @param event - The `change` event emitted by the pagination element.
   */
  protected handlePageChange(event: Event): void {
    const detail = (event as CustomEvent<{ page?: number }>).detail;
    if (typeof detail?.page === 'number') {
      this.currentPage.set(detail.page);
    }
  }

  /**
   * Records which dropdown item was chosen.
   *
   * @param label - Text of the selected item.
   */
  protected handleSelect(label: string): void {
    this.lastSelection.set(label);
  }
}
