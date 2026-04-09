/**
 * Application routes with lazy loading and functional auth guards.
 *
 * Lazy loading (`loadComponent`) splits each page into a separate JS chunk.
 * The chunk is downloaded only when the route is first navigated to, reducing
 * the initial bundle size.
 *
 * Guards are plain functions using `inject()` (Angular 15+ functional guards)
 * rather than classes implementing `CanActivate`. This removes boilerplate and
 * makes the guard logic easier to test in isolation.
 *
 * Guard return values:
 *   - `true`              → allow navigation
 *   - `router.parseUrl()` → redirect (preferred over `false` — gives a URL
 *                           for the router to navigate to instead of a blank)
 */
import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import { ME_QUERY } from './graphql/queries';

function authGuard() {
  const apollo = inject(Apollo);
  const router = inject(Router);
  return apollo
    .watchQuery({ query: ME_QUERY })
    .valueChanges.pipe(
      map((r: any) => r.data?.me ?? null),
      map((user) => user ? true : router.parseUrl('/login'))
    );
}

function publicGuard() {
  const apollo = inject(Apollo);
  const router = inject(Router);
  return apollo
    .watchQuery({ query: ME_QUERY })
    .valueChanges.pipe(
      map((r: any) => r.data?.me ?? null),
      map((user) => user ? router.parseUrl('/') : true)
    );
}

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'projects/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/project/project.component').then((m) => m.ProjectComponent),
  },
  { path: '**', redirectTo: '' },
];
