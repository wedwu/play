// ============================================================
// APP COMPONENT — ES6 Arrow Functions + All Lifecycle Hooks
// ============================================================

import {
  Component, OnInit, OnDestroy, AfterViewInit, AfterContentInit,
  AfterContentChecked, AfterViewChecked, OnChanges, SimpleChanges,
  DoCheck, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from './core/services/notification.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NavComponent } from './shared/components/nav/nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, NavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent
  implements OnInit, OnChanges, DoCheck, AfterContentInit,
             AfterContentChecked, AfterViewInit, AfterViewChecked, OnDestroy
{
  @ViewChild('mainRef') mainRef!: ElementRef<HTMLElement>;

  private readonly destroy$ = new Subject<void>();
  private checkCount = 0;

  constructor(
    private notifications: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('[AppComponent] constructor');
  }

  // ── All 8 Lifecycle Hooks as arrow properties ─

  ngOnChanges = (changes: SimpleChanges): void => {
    console.log('[AppComponent] ngOnChanges', Object.keys(changes));
  };

  ngOnInit = (): void => {
    console.log('[AppComponent] ngOnInit');
    this.notifications.notifications$.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());
  };

  ngDoCheck = (): void => { this.checkCount++; };

  ngAfterContentInit = (): void => {
    console.log('[AppComponent] ngAfterContentInit');
  };

  ngAfterContentChecked = (): void => { /* runs every check cycle */ };

  ngAfterViewInit = (): void => {
    console.log('[AppComponent] ngAfterViewInit — mainRef:', this.mainRef);
  };

  ngAfterViewChecked = (): void => { /* avoid triggering further changes here */ };

  ngOnDestroy = (): void => {
    console.log('[AppComponent] ngOnDestroy');
    this.destroy$.next();
    this.destroy$.complete();
  };

  get lifecycleStats() { return { checkCount: this.checkCount }; }
}
