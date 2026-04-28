// ============================================================
// CUSTOM DIRECTIVES — ES6 Arrow Functions Throughout
// ============================================================

import {
  Directive, Input, Output, EventEmitter, ElementRef,
  HostListener, Renderer2, OnInit, OnDestroy,
  TemplateRef, ViewContainerRef, AfterViewInit
} from '@angular/core';

// ── Auto-Focus ────────────────────────────────

/**
 * Automatically focuses the host element after the view initialises.
 *
 * @example
 * `<input [appAutoFocus]="true" [focusDelay]="100" />`
 */
@Directive({ selector: '[appAutoFocus]', standalone: true })
export class AutoFocusDirective implements AfterViewInit {
  /** When `true` (default), focus is applied on init. Set to `false` to disable. */
  @Input() appAutoFocus = true;
  /** Optional delay in milliseconds before `focus()` is called. */
  @Input() focusDelay   = 0;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit = (): void => {
    if (this.appAutoFocus) setTimeout(() => this.el.nativeElement.focus(), this.focusDelay);
  };
}

// ── Click Outside ─────────────────────────────

/**
 * Emits {@link appClickOutside} whenever the user clicks anywhere outside the
 * host element. Useful for closing dropdowns and popovers.
 *
 * @example
 * `<div (appClickOutside)="close()">...</div>`
 */
@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective {
  /** Emits `void` when a click is detected outside the host element. */
  @Output() appClickOutside = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onClick = (target: HTMLElement): void => {
    if (!this.el.nativeElement.contains(target)) this.appClickOutside.emit();
  };
}

// ── Ripple Effect ─────────────────────────────

/**
 * Adds a Material-style circular ripple animation to the host element on click.
 * Automatically sets `position: relative` and `overflow: hidden` on the host.
 *
 * @example
 * `<button appRipple [rippleColor]="'rgba(0,0,0,0.15)'">Click me</button>`
 */
@Directive({ selector: '[appRipple]', standalone: true })
export class RippleDirective {
  /** CSS colour of the ripple circle. Defaults to a semi-transparent white. */
  @Input() rippleColor = 'rgba(255,255,255,0.3)';

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'overflow', 'hidden');
  }

  @HostListener('click', ['$event'])
  onClick = (event: MouseEvent): void => {
    const el   = this.el.nativeElement;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x    = event.clientX - rect.left - size / 2;
    const y    = event.clientY - rect.top  - size / 2;

    const ripple = this.renderer.createElement('span') as HTMLElement;
    const styles: Record<string, string> = {
      position: 'absolute', width: `${size}px`, height: `${size}px`,
      left: `${x}px`, top: `${y}px`, background: this.rippleColor,
      'border-radius': '50%', transform: 'scale(0)',
      animation: 'ripple 0.6s linear', 'pointer-events': 'none',
    };
    Object.entries(styles).forEach(([k, v]) => this.renderer.setStyle(ripple, k, v));
    this.renderer.appendChild(el, ripple);
    setTimeout(() => this.renderer.removeChild(el, ripple), 600);
  };
}

// ── Tooltip ───────────────────────────────────

/**
 * Renders a lightweight tooltip appended to `document.body` on hover.
 * The tooltip is removed on `mouseleave` and on directive destroy.
 *
 * @example
 * `<span [appTooltip]="'More info'" tooltipPlacement="bottom">?</span>`
 */
@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective implements OnDestroy {
  /** Text content of the tooltip. No tooltip is shown when empty. */
  @Input('appTooltip') text = '';
  /** Which side of the host element the tooltip appears on. Defaults to `'top'`. */
  @Input() tooltipPlacement: 'top' | 'bottom' | 'left' | 'right' = 'top';

  private tooltip?: HTMLElement;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  show = (): void => {
    if (!this.text) return;
    this.tooltip = this.renderer.createElement('div') as HTMLElement;
    this.tooltip.className = 'app-tooltip';
    this.tooltip.textContent = this.text;
    this.renderer.appendChild(document.body, this.tooltip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    const top  = this.tooltipPlacement === 'bottom' ? rect.bottom + 8 : rect.top - 36;
    const left = rect.left + rect.width / 2 - 60;
    this.renderer.setStyle(this.tooltip, 'top',  `${top  + window.scrollY}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  };

  @HostListener('mouseleave')
  hide = (): void => {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = undefined;
    }
  };

  ngOnDestroy = (): void => this.hide();
}

// ── Structural: If Permission ─────────────────

/**
 * Structural directive that conditionally renders its host template based on
 * whether the given `permission` key exists in the user's allowed list.
 * Renders `elseTemplate` when the permission check fails.
 *
 * @example
 * ```html
 * <div *appIfPermission="'canCreate'; else noAccess">Create button</div>
 * <ng-template #noAccess>Read-only</ng-template>
 * ```
 */
@Directive({ selector: '[appIfPermission]', standalone: true })
export class IfPermissionDirective implements OnInit {
  /** The permission key to check (e.g. `'canCreate'`, `'canRead'`). */
  @Input('appIfPermission')   permission    = '';
  /** Optional template to render when the permission check fails. */
  @Input('appIfPermissionElse') elseTemplate?: TemplateRef<unknown>;

  private hasView = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnInit = (): void => {
    const userPermissions = ['canCreate', 'canRead', 'canUpdate'];
    const allowed = userPermissions.includes(this.permission) || !this.permission;

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed) {
      this.viewContainer.clear();
      if (this.elseTemplate) this.viewContainer.createEmbeddedView(this.elseTemplate);
      this.hasView = false;
    }
  };
}

// ── Scroll Spy ────────────────────────────────

/**
 * Listens to scroll events on the host element and emits:
 * - {@link scrolled} with the current scroll position as a percentage (0–100).
 * - {@link atBottom} when the user has scrolled within 20 px of the bottom.
 *
 * @example
 * `<div appScrollSpy (scrolled)="onScroll($event)" (atBottom)="loadMore()">…</div>`
 */
@Directive({ selector: '[appScrollSpy]', standalone: true })
export class ScrollSpyDirective implements OnInit, OnDestroy {
  /** Emits the vertical scroll position as a percentage (0–100). */
  @Output() scrolled  = new EventEmitter<number>();
  /** Emits when the bottom of the scrollable area is within 20 px. */
  @Output() atBottom  = new EventEmitter<void>();

  private unlistenScroll?: () => void;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  ngOnInit = (): void => {
    this.unlistenScroll = this.renderer.listen(this.el.nativeElement, 'scroll', () => {
      const el           = this.el.nativeElement;
      const scrollPercent = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      this.scrolled.emit(scrollPercent);
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) this.atBottom.emit();
    });
  };

  ngOnDestroy = (): void => this.unlistenScroll?.();
}
