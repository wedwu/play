// ============================================================
// APP CONFIG — Standalone bootstrap configuration
// ============================================================

import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { authInterceptor, errorInterceptor, loggingInterceptor } from './core/interceptors/http.interceptor';

export const routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' as const },
  {
    path: 'dashboard',
    loadComponent: () => import('./modules/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'tasks',
    loadComponent: () => import('./modules/tasks/tasks.component').then(m => m.TasksComponent),
  },
  {
    path: 'users',
    loadComponent: () => import('./modules/users/users.component').then(m => m.UsersComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, loggingInterceptor])),
    provideAnimations(),
  ],
};
