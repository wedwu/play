import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900">TaskFlow</h1>
          <p class="text-gray-500 mt-1">Angular + GraphQL client</p>
        </div>

        <div class="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button *ngFor="let m of ['login', 'register']"
            (click)="mode.set(m)"
            [class]="mode() === m
              ? 'flex-1 py-2 text-sm font-medium rounded-md bg-white shadow text-gray-900'
              : 'flex-1 py-2 text-sm font-medium text-gray-500 hover:text-gray-700'">
            {{ m === 'login' ? 'Sign In' : 'Create Account' }}
          </button>
        </div>

        <form (ngSubmit)="submit()" #loginForm="ngForm" class="space-y-4">
          <div *ngIf="mode() === 'register'">
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" [(ngModel)]="name" name="name" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your name" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" [(ngModel)]="email" name="email" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" [(ngModel)]="password" name="password" required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>

          <div *ngIf="error()" class="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {{ error() }}
          </div>

          <button type="submit" [disabled]="loading()"
            class="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {{ loading() ? 'Please wait...' : (mode() === 'login' ? 'Sign In' : 'Create Account') }}
          </button>
        </form>

        <div class="mt-6 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <p class="font-medium mb-1">Demo credentials:</p>
          <p>admin&#64;taskflow.dev / admin123</p>
          <p>bob&#64;taskflow.dev / member123</p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  mode = signal<string>('login');
  email = 'admin@taskflow.dev';
  password = 'admin123';
  name = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

  submit() {
    this.loading.set(true);
    this.error.set(null);

    const obs = this.mode() === 'login'
      ? this.authService.login(this.email, this.password)
      : this.authService.register(this.email, this.password, this.name);

    obs.subscribe({
      next: () => this.router.navigate(['/']),
      error: (err: Error) => {
        this.error.set(err.message ?? 'Authentication failed');
        this.loading.set(false);
      },
    });
  }
}
