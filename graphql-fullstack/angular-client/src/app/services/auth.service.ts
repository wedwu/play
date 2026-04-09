/**
 * AuthService — authentication state and actions.
 *
 * State is held in Angular Signals rather than BehaviorSubjects because:
 * - Signals integrate with Angular's fine-grained change detection (no Zone.js
 *   overhead for components that only read `user()` or `isAuthenticated()`).
 * - `computed()` creates a derived signal that re-evaluates automatically when
 *   its dependencies change.
 * - Signals are synchronous — reading `user()` never returns a Promise or
 *   Observable, which simplifies template bindings and guard logic.
 *
 * The public API exposes read-only signals (`user`, `isAuthenticated`) so
 * only this service can mutate the underlying state.
 */
import { Injectable, signal, computed } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../graphql/mutations';
import { ME_QUERY } from '../graphql/queries';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);

  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor(private apollo: Apollo, private router: Router) {}

  loadCurrentUser() {
    return this.apollo.watchQuery({ query: ME_QUERY }).valueChanges.pipe(
      map((result: any) => result.data?.me ?? null),
      tap((user) => this._user.set(user))
    );
  }

  login(email: string, password: string) {
    return this.apollo
      .mutate({ mutation: LOGIN_MUTATION, variables: { input: { email, password } } })
      .pipe(
        map((result: any) => result.data?.login),
        tap((auth) => {
          if (auth?.token) {
            localStorage.setItem('token', auth.token);
            this._user.set(auth.user);
            this.apollo.client.resetStore();
          }
        })
      );
  }

  register(email: string, password: string, name: string) {
    return this.apollo
      .mutate({ mutation: REGISTER_MUTATION, variables: { input: { email, password, name } } })
      .pipe(
        map((result: any) => result.data?.register),
        tap((auth) => {
          if (auth?.token) {
            localStorage.setItem('token', auth.token);
            this._user.set(auth.user);
            this.apollo.client.resetStore();
          }
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    this._user.set(null);
    this.apollo.client.clearStore();
    this.router.navigate(['/login']);
  }
}
