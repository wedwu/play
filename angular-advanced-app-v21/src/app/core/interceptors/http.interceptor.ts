// ============================================================
// HTTP INTERCEPTORS — ES6 Arrow Functions (functional API)
// ============================================================

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

/** Human-readable messages for common HTTP error status codes. */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  0:   'Network error — check your connection',
  401: 'Unauthorized — please log in again',
  403: 'Forbidden — insufficient permissions',
  404: 'Resource not found',
};

/**
 * Attaches a `Bearer` token to every outgoing request when `auth_token` exists
 * in `localStorage`. Passes the original request unchanged when no token is present.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('auth_token');
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

/**
 * Catches HTTP errors and surfaces a user-visible notification via
 * {@link NotificationService}. Re-throws the error so downstream subscribers
 * can also react. Defaults to a generic server-error or unexpected-error message
 * for status codes not listed in {@link HTTP_ERROR_MESSAGES}.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = HTTP_ERROR_MESSAGES[error.status]
        ?? (error.status >= 500 ? 'Server error — please try again' : 'An unexpected error occurred');
      notifications.error(`HTTP ${error.status}`, message);
      return throwError(() => error);
    })
  );
};

/**
 * Logs every HTTP request to the console with its method, URL, and total
 * elapsed time in milliseconds. HTTP errors are logged at `console.error` level.
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  return next(req).pipe(
    tap({ error: err => console.error(`[HTTP ERROR] ${req.method} ${req.url}`, err) }),
    finalize(() => console.log(`[HTTP] ${req.method} ${req.url} — ${Date.now() - start}ms`))
  );
};
