import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  signal,
} from '@angular/core';
import { DemoSection } from '../../shared/demo-section/demo-section';
import { PageHeader } from '../../shared/page-header/page-header';

/** A component listed in the coverage gallery. */
export interface ComponentEntry {
  /** Custom element tag name. */
  readonly tag: string;
  /** Group the component belongs to. */
  readonly group: 'Form' | 'Display' | 'Overlay' | 'Navigation' | 'Utility';
  /** Whether this repo demonstrates it on a dedicated page. */
  readonly demonstrated: boolean;
}

/**
 * Kitchen sink page.
 *
 * Two jobs: show the components that did not fit the themed pages, and give a
 * complete inventory of the Web Awesome surface so gaps in coverage are
 * visible rather than implied.
 */
@Component({
  selector: 'aa-kitchen-sink-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [DemoSection, PageHeader],
  templateUrl: './kitchen-sink-page.html',
  styleUrl: './kitchen-sink-page.scss',
})
export class KitchenSinkPage {
  /**
   * Full component inventory for Web Awesome 3.13.
   *
   * `demonstrated` marks the components rendered live somewhere in this repo.
   */
  protected readonly inventory: readonly ComponentEntry[] = [
    { tag: 'wa-button', group: 'Form', demonstrated: true },
    { tag: 'wa-button-group', group: 'Form', demonstrated: true },
    { tag: 'wa-checkbox', group: 'Form', demonstrated: true },
    { tag: 'wa-checkbox-group', group: 'Form', demonstrated: false },
    { tag: 'wa-color-picker', group: 'Form', demonstrated: true },
    { tag: 'wa-input', group: 'Form', demonstrated: true },
    { tag: 'wa-number-input', group: 'Form', demonstrated: true },
    { tag: 'wa-option', group: 'Form', demonstrated: true },
    { tag: 'wa-otp-input', group: 'Form', demonstrated: true },
    { tag: 'wa-radio', group: 'Form', demonstrated: true },
    { tag: 'wa-radio-group', group: 'Form', demonstrated: true },
    { tag: 'wa-rating', group: 'Form', demonstrated: true },
    { tag: 'wa-select', group: 'Form', demonstrated: true },
    { tag: 'wa-slider', group: 'Form', demonstrated: true },
    { tag: 'wa-switch', group: 'Form', demonstrated: true },
    { tag: 'wa-tag-input', group: 'Form', demonstrated: true },
    { tag: 'wa-textarea', group: 'Form', demonstrated: true },
    { tag: 'wa-time-input', group: 'Form', demonstrated: true },
    { tag: 'wa-animated-image', group: 'Display', demonstrated: false },
    { tag: 'wa-avatar', group: 'Display', demonstrated: true },
    { tag: 'wa-badge', group: 'Display', demonstrated: true },
    { tag: 'wa-card', group: 'Display', demonstrated: true },
    { tag: 'wa-carousel', group: 'Display', demonstrated: true },
    { tag: 'wa-carousel-item', group: 'Display', demonstrated: true },
    { tag: 'wa-comparison', group: 'Display', demonstrated: true },
    { tag: 'wa-format-bytes', group: 'Display', demonstrated: true },
    { tag: 'wa-format-date', group: 'Display', demonstrated: true },
    { tag: 'wa-format-number', group: 'Display', demonstrated: true },
    { tag: 'wa-icon', group: 'Display', demonstrated: true },
    { tag: 'wa-progress-bar', group: 'Display', demonstrated: true },
    { tag: 'wa-progress-ring', group: 'Display', demonstrated: true },
    { tag: 'wa-qr-code', group: 'Display', demonstrated: true },
    { tag: 'wa-relative-time', group: 'Display', demonstrated: true },
    { tag: 'wa-skeleton', group: 'Display', demonstrated: true },
    { tag: 'wa-spinner', group: 'Display', demonstrated: true },
    { tag: 'wa-tag', group: 'Display', demonstrated: true },
    { tag: 'wa-tree', group: 'Display', demonstrated: true },
    { tag: 'wa-tree-item', group: 'Display', demonstrated: true },
    { tag: 'wa-callout', group: 'Overlay', demonstrated: true },
    { tag: 'wa-details', group: 'Overlay', demonstrated: true },
    { tag: 'wa-dialog', group: 'Overlay', demonstrated: true },
    { tag: 'wa-drawer', group: 'Overlay', demonstrated: true },
    { tag: 'wa-popover', group: 'Overlay', demonstrated: true },
    { tag: 'wa-popup', group: 'Overlay', demonstrated: false },
    { tag: 'wa-toast', group: 'Overlay', demonstrated: false },
    { tag: 'wa-tooltip', group: 'Overlay', demonstrated: true },
    { tag: 'wa-accordion', group: 'Navigation', demonstrated: true },
    { tag: 'wa-accordion-item', group: 'Navigation', demonstrated: true },
    { tag: 'wa-breadcrumb', group: 'Navigation', demonstrated: true },
    { tag: 'wa-breadcrumb-item', group: 'Navigation', demonstrated: true },
    { tag: 'wa-divider', group: 'Navigation', demonstrated: true },
    { tag: 'wa-dropdown', group: 'Navigation', demonstrated: true },
    { tag: 'wa-dropdown-item', group: 'Navigation', demonstrated: true },
    { tag: 'wa-pagination', group: 'Navigation', demonstrated: true },
    { tag: 'wa-scroller', group: 'Navigation', demonstrated: true },
    { tag: 'wa-split-panel', group: 'Navigation', demonstrated: true },
    { tag: 'wa-tab', group: 'Navigation', demonstrated: true },
    { tag: 'wa-tab-group', group: 'Navigation', demonstrated: true },
    { tag: 'wa-tab-panel', group: 'Navigation', demonstrated: true },
    { tag: 'wa-animation', group: 'Utility', demonstrated: false },
    { tag: 'wa-copy-button', group: 'Utility', demonstrated: true },
    { tag: 'wa-include', group: 'Utility', demonstrated: false },
    { tag: 'wa-intersection-observer', group: 'Utility', demonstrated: false },
    { tag: 'wa-mutation-observer', group: 'Utility', demonstrated: false },
    { tag: 'wa-resize-observer', group: 'Utility', demonstrated: false },
    { tag: 'wa-zoomable-frame', group: 'Utility', demonstrated: false },
  ];

  /** Active group filter; `all` shows every entry. */
  protected readonly filter = signal<'all' | ComponentEntry['group']>('all');

  /** Inventory narrowed by the active filter. */
  protected readonly visibleInventory = computed(() => {
    const active = this.filter();
    return active === 'all'
      ? this.inventory
      : this.inventory.filter((entry) => entry.group === active);
  });

  /** Count of components rendered live somewhere in the repo. */
  protected readonly demonstratedCount = computed(
    () => this.inventory.filter((entry) => entry.demonstrated).length,
  );

  /** Total number of catalogued components. */
  protected readonly totalCount = this.inventory.length;

  /**
   * Applies a group filter to the inventory table.
   *
   * @param group - Group to show, or `all` to clear the filter.
   */
  protected setFilter(group: 'all' | ComponentEntry['group']): void {
    this.filter.set(group);
  }
}
