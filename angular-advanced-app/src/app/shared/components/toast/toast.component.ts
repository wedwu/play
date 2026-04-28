// ============================================================
// TOAST COMPONENT — ES6 Arrow Functions
// ============================================================

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { NgClass } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService, Notification } from '../../../core/services/notification.service';

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
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast" [@toastAnim] [ngClass]="'toast--' + toast.type" (click)="dismiss(toast.id)">
          <div class="toast-icon">{{ icons[toast.type] }}</div>
          <div class="toast-body">
            <strong class="toast-title">{{ toast.title }}</strong>
            @if (toast.message) { <p class="toast-msg">{{ toast.message }}</p> }
          </div>
          <button class="toast-close" (click)="dismiss(toast.id); $event.stopPropagation()">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.75rem; max-width: 360px; }
    .toast { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; border-radius: 8px; background: var(--bg-elevated); border: 1px solid var(--border); box-shadow: 0 8px 32px rgba(0,0,0,0.4); cursor: pointer; }
    .toast--success { border-left: 4px solid #4ECDC4; }
    .toast--error   { border-left: 4px solid #FF6B6B; }
    .toast--warn    { border-left: 4px solid #FFEAA7; }
    .toast--info    { border-left: 4px solid #45B7D1; }
    .toast-icon { font-size: 1.25rem; margin-top: 1px; }
    .toast-body { flex: 1; min-width: 0; }
    .toast-title { font-family: 'Syne', sans-serif; font-size: 0.9rem; color: var(--text-primary); display: block; }
    .toast-msg { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--text-secondary); margin: 0.25rem 0 0; }
    .toast-close { background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 0.75rem; padding: 0; }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Notification[] = [];
  readonly icons = { success: '✅', error: '❌', warn: '⚠️', info: 'ℹ️' } as const;
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

  dismiss = (id: string): void => {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.markForCheck();
  };

  ngOnDestroy = (): void => {
    this.destroy$.next();
    this.destroy$.complete();
  };
}
