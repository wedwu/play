// ============================================================
// CUSTOM DIRECTIVES
// ============================================================

import {
  Directive,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  HostListener,
  Renderer2,
  OnInit,
  OnDestroy,
  AfterViewInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from "@angular/core";

/**
 * Automatically focuses the host element after the view initializes.
 *
 * @example
 * `<input [appAutoFocus]="true" [focusDelay]="100" />`
 */
@Directive({ selector: "[appAutoFocus]", standalone: true })
export class AutoFocusDirective implements AfterViewInit {
  @Input() appAutoFocus = true;
  @Input() focusDelay = 0;

  private readonly el = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    if (this.appAutoFocus) {
      setTimeout(() => this.el.nativeElement.focus(), this.focusDelay);
    }
  }
}

/**
 * Emits when the user clicks outside the host element.
 *
 * @example
 * `<div (appClickOutside)="close()">...</div>`
 */
@Directive({ selector: "[appClickOutside]", standalone: true })
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  private readonly el = inject(ElementRef);

  @HostListener("document:click", ["$event"])
  onClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.el.nativeElement.contains(target)) {
      this.appClickOutside.emit();
    }
  }
}

/**
 * Adds a Material-style ripple effect on click.
 *
 * @example
 * `<button appRipple [rippleColor]="'rgba(0,0,0,0.15)'">Click me</button>`
 */
@Directive({ selector: "[appRipple]", standalone: true })
export class RippleDirective {
  @Input() rippleColor = "rgba(255,255,255,0.3)";

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  constructor() {
    this.renderer.setStyle(this.el.nativeElement, "position", "relative");
    this.renderer.setStyle(this.el.nativeElement, "overflow", "hidden");
  }

  @HostListener("click", ["$event"])
  onClick(event: MouseEvent): void {
    const el = this.el.nativeElement;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = this.renderer.createElement("span") as HTMLElement;

    const styles: Record<string, string> = {
      "position": "absolute",
      "width": `${size}px`,
      "height": `${size}px`,
      "left": `${x}px`,
      "top": `${y}px`,
      "background": this.rippleColor,
      "border-radius": "50%",
      "transform": "scale(0)",
      "animation": "ripple 0.6s linear",
      "pointer-events": "none",
    };

    Object.entries(styles).forEach(([key, value]) =>
      this.renderer.setStyle(ripple, key, value),
    );

    this.renderer.appendChild(el, ripple);

    setTimeout(() => this.renderer.removeChild(el, ripple), 600);
  }
}

/**
 * Displays a lightweight tooltip on hover.
 *
 * @example
 * `<span [appTooltip]="'More info'" tooltipPlacement="bottom">?</span>`
 */
@Directive({ selector: "[appTooltip]", standalone: true })
export class TooltipDirective implements OnDestroy {
  @Input() appTooltip = ""; // ← no alias

  @Input() tooltipPlacement: "top" | "bottom" | "left" | "right" = "top";

  private tooltip?: HTMLElement;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  @HostListener("mouseenter")
  show(): void {
    if (!this.appTooltip) return;

    this.tooltip = this.renderer.createElement("div") as HTMLElement;
    this.tooltip.className = "app-tooltip";
    this.tooltip.textContent = this.appTooltip;

    this.renderer.appendChild(document.body, this.tooltip);

    const rect = this.el.nativeElement.getBoundingClientRect();
    const top = this.tooltipPlacement === "bottom" ? rect.bottom + 8 : rect.top; // - 36;
    const left = rect.left + rect.width / 2 + 30; // - 60;

    this.renderer.setStyle(this.tooltip, "top", `${top + window.scrollY}px`);
    this.renderer.setStyle(this.tooltip, "left", `${left}px`);
  }

  @HostListener("mouseleave")
  hide(): void {
    if (this.tooltip) {
      this.renderer.removeChild(document.body, this.tooltip);
      this.tooltip = undefined;
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }
}

/**
 * Structural directive – shows content only if the user has the given permission.
 *
 * @example
 * ```html
 * <div *appIfPermission="'canCreate'; else noAccess">Create button</div>
 * <ng-template #noAccess>Read-only</ng-template>
 * ```
 */
@Directive({ selector: "[appIfPermission]", standalone: true })
export class IfPermissionDirective implements OnInit {
  @Input() appIfPermission = ""; // ← no alias
  @Input() appIfPermissionElse?: TemplateRef<unknown>;

  private hasView = false;

  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  ngOnInit(): void {
    const userPermissions = ["canCreate", "canRead", "canUpdate"];
    const allowed =
      userPermissions.includes(this.appIfPermission) || !this.appIfPermission;

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed) {
      this.viewContainer.clear();
      if (this.appIfPermissionElse) {
        this.viewContainer.createEmbeddedView(this.appIfPermissionElse);
      }
      this.hasView = false;
    }
  }
}

/**
 * Emits scroll progress and bottom-reached events.
 *
 * @example
 * `<div appScrollSpy (scrolled)="onScroll($event)" (atBottom)="loadMore()">…</div>`
 */
@Directive({ selector: "[appScrollSpy]", standalone: true })
export class ScrollSpyDirective implements OnInit, OnDestroy {
  @Output() scrolled = new EventEmitter<number>();
  @Output() atBottom = new EventEmitter<void>();

  private unlistenScroll?: () => void;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    this.unlistenScroll = this.renderer.listen(
      this.el.nativeElement,
      "scroll",
      () => {
        const el = this.el.nativeElement;
        const scrollPercent = Math.round(
          (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100,
        );

        this.scrolled.emit(scrollPercent);

        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
          this.atBottom.emit();
        }
      },
    );
  }

  ngOnDestroy(): void {
    this.unlistenScroll?.();
  }
}
