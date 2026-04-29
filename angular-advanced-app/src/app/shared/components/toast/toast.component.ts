// ============================================================
// TOAST COMPONENT — ES6 Arrow Functions
// ============================================================

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService, Notification } from '../../../core/services/notification.service';

/**
 * Global toast notification tray.
 *
 * Subscribes to {@link NotificationService.notifications$} and renders each
 * incoming notification as a dismissible toast that slides in from the right.
 * Toasts with a positive `duration` are auto-dismissed after that many milliseconds.
 * Clicking a toast or its close button dismisses it immediately.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toastAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('250ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent implements OnInit, OnDestroy {
  /** Currently visible toasts. New items are appended; dismissed items are filtered out. */
  toasts: Notification[] = [];
  /** Emoji icons keyed by notification type, used in the toast template. */
  readonly icons = { success: 'check_circle', error: 'error', warn: 'warning', info: 'info' } as const;
  private readonly destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService, private cdr: ChangeDetectorRef) {}

  ngOnInit = (): void => {
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.toasts = [...this.toasts, notification];
        this.cdr.markForCheck();
        if (notification.duration > 0)
          setTimeout(() => this.dismiss(notification.id), notification.duration);
      });
  };

  /**
   * Removes the toast with the given `id` from the visible list.
   * @param id - ID of the notification to dismiss.
   */
  dismiss = (id: string): void => {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.markForCheck();
  };

  ngOnDestroy = (): void => {
    this.destroy$.next();
    this.destroy$.complete();
  };
}
