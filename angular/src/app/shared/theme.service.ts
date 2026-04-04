import { Injectable, signal } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.getInitial());

  private getInitial(): Theme {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  apply() {
    document.documentElement.setAttribute('data-theme', this.theme());
  }

  toggle() {
    const next = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }
}
