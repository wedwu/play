// ============================================================
// APP COMPONENT
// ============================================================

import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  AfterContentInit,
  AfterContentChecked,
  AfterViewChecked,
  OnChanges,
  DoCheck,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChanges,
  inject,
} from "@angular/core";

import { RouterOutlet } from "@angular/router";
import { Subject, takeUntil } from "rxjs";

import { NotificationService } from "./core/services/notification.service";
import { ToastComponent } from "./shared/components/toast/toast.component";
import { NavComponent } from "./shared/components/nav/nav.component";

/**
 * Root application component.
 *
 * Demonstrates **all major Angular lifecycle hooks** in one place for educational/debug purposes.
 * Uses OnPush change detection and integrates the global notification system.
 */
@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent
  implements
    OnInit,
    OnChanges,
    DoCheck,
    AfterContentInit,
    AfterContentChecked,
    AfterViewInit,
    AfterViewChecked,
    OnDestroy
{
  /** Reference to the main content element */
  @ViewChild("mainRef") mainRef!: ElementRef<HTMLElement>;

  // ── Injected Dependencies ──

  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Subject used for automatic unsubscription from observables */
  private readonly destroy$ = new Subject<void>();

  /** Counter for how many times `ngDoCheck` has run */
  private checkCount = 0;

  constructor() {
    console.log("[AppComponent] constructor");
  }

  // ── Lifecycle Hooks ──

  ngOnChanges(changes: SimpleChanges): void {
    console.log("[AppComponent] ngOnChanges", Object.keys(changes));
  }

  ngOnInit(): void {
    console.log("[AppComponent] ngOnInit");

    this.notifications.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());
  }

  ngDoCheck(): void {
    this.checkCount++;
  }

  ngAfterContentInit(): void {
    console.log("[AppComponent] ngAfterContentInit");
  }

  ngAfterContentChecked(): void {
    // Runs every change detection cycle after content is checked
    console.log("[AppComponent] ngAfterContentChecked");
  }

  ngAfterViewInit(): void {
    console.log("[AppComponent] ngAfterViewInit — mainRef:", this.mainRef);
  }

  ngAfterViewChecked(): void {
    // Runs every change detection cycle after view is checked
    // Avoid heavy operations or change triggering here
    console.log("[AppComponent] ngAfterViewChecked");
  }

  ngOnDestroy(): void {
    console.log("[AppComponent] ngOnDestroy");
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Returns current lifecycle statistics for debugging.
   * Used in the template to show how many times change detection has run.
   */
  get lifecycleStats() {
    return { checkCount: this.checkCount };
  }
}
