// ============================================================
// NOTIFICATION SERVICE — ES6 Arrow Functions
// ============================================================

import { Injectable } from '@angular/core';
import { Subject, Observable, timer } from 'rxjs';
import { tap } from 'rxjs/operators';

export type NotificationType = 'success' | 'error' | 'warn' | 'info';

export interface Notification {
  id: string; type: NotificationType; title: string;
  message: string; timestamp: Date; duration: number; read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _notifications$ = new Subject<Notification>();
  private readonly _history: Notification[] = [];

  readonly notifications$: Observable<Notification> = this._notifications$.asObservable();

  get history(): Notification[] { return [...this._history]; }
  get unreadCount(): number { return this._history.filter(n => !n.read).length; }

  private emit = (type: NotificationType, title: string, message: string, duration = 4000): void => {
    const n: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type, title, message, duration, timestamp: new Date(), read: false,
    };
    this._history.unshift(n);
    if (this._history.length > 50) this._history.pop();
    this._notifications$.next(n);
    if (duration > 0) timer(duration).pipe(tap(() => this.markRead(n.id))).subscribe();
  };

  success = (title: string, message = ''): void => this.emit('success', title, message);
  error   = (title: string, message = ''): void => this.emit('error',   title, message, 6000);
  warn    = (title: string, message = ''): void => this.emit('warn',    title, message, 5000);
  info    = (title: string, message = ''): void => this.emit('info',    title, message);

  markRead    = (id: string): void => { const n = this._history.find(n => n.id === id); if (n) n.read = true; };
  markAllRead = (): void => { this._history.forEach(n => n.read = true); };
  clearHistory = (): void => { this._history.length = 0; };
}
