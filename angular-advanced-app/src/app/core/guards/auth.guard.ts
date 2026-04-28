// ============================================================
// ROUTE GUARDS — ES6 Arrow Functions (functional API)
// ============================================================

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';
import { map, take } from 'rxjs/operators';
import { UserRole } from '../models/user.model';

/**
 * Functional route guard that verifies a valid `auth_token` exists in
 * `localStorage`. Redirects to `/login` and returns `false` when absent.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const hasToken = !!localStorage.getItem('auth_token');
  if (!hasToken) router.navigate(['/login']);
  return hasToken;
};

/**
 * Higher-order functional guard that restricts route access to users whose
 * role is included in the provided list. Redirects to `/unauthorized` on failure.
 *
 * @param roles - One or more {@link UserRole} values permitted to activate the route.
 * @example
 * { path: 'settings', canActivate: [roleGuard('admin', 'manager')] }
 */
export const roleGuard = (...roles: UserRole[]): CanActivateFn => () => {
  const userService = inject(UserService);
  const router      = inject(Router);
  return userService.selected$.pipe(
    take(1),
    map(user => {
      if (user && roles.includes(user.role)) return true;
      router.navigate(['/unauthorized']);
      return false;
    })
  );
};
