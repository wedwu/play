import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import { DemoSection } from '../../shared/demo-section/demo-section';
import { PageHeader } from '../../shared/page-header/page-header';

/** Minimal surface of the `wa-dialog` / `wa-drawer` elements used here. */
interface OpenableElement extends HTMLElement {
  open: boolean;
}

/**
 * Overlays and feedback page.
 *
 * Dialogs and drawers are imperative: the element owns its own `open`
 * property, so Angular opens them by setting that property on the element
 * reference rather than by re-rendering. `viewChild` returns the custom
 * element directly, which keeps the interaction explicit.
 */
@Component({
  selector: 'aa-overlays-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [DemoSection, PageHeader],
  templateUrl: './overlays-page.html',
  styleUrl: './overlays-page.scss',
})
export class OverlaysPage {
  private readonly dialog = viewChild<ElementRef<OpenableElement>>('dialog');
  private readonly drawer = viewChild<ElementRef<OpenableElement>>('drawer');

  /** Most recent action taken in the dialog, echoed back into the page. */
  protected readonly lastAction = signal<string>('none');

  /** Opens the example dialog. */
  protected openDialog(): void {
    this.setOpen(this.dialog(), true);
  }

  /**
   * Closes the example dialog and records which control dismissed it.
   *
   * @param action - Label describing how the dialog was closed.
   */
  protected closeDialog(action: string): void {
    this.lastAction.set(action);
    this.setOpen(this.dialog(), false);
  }

  /** Opens the example drawer. */
  protected openDrawer(): void {
    this.setOpen(this.drawer(), true);
  }

  /** Closes the example drawer. */
  protected closeDrawer(): void {
    this.setOpen(this.drawer(), false);
  }

  private setOpen(ref: ElementRef<OpenableElement> | undefined, open: boolean): void {
    if (ref) {
      ref.nativeElement.open = open;
    }
  }
}
