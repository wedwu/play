import { Injectable, signal } from '@angular/core';

/** Colour schemes the demo application can render in. */
export type ThemeMode = 'light' | 'dark';

/** Key used to persist the selected colour scheme. */
const THEME_STORAGE_KEY = 'aa-theme-mode';

/**
 * Tracks and applies the active colour scheme.
 *
 * Web Awesome ships light and dark palettes driven by a `wa-dark` class on the
 * document root, so switching themes is a class toggle rather than a
 * stylesheet swap. The current mode is exposed as a signal for templates.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly mode = signal<ThemeMode>(this.readStoredMode());

  /** Read-only view of the active colour scheme. */
  readonly current = this.mode.asReadonly();

  constructor() {
    this.apply(this.mode());
  }

  /**
   * Switches to a specific colour scheme.
   *
   * @param mode - Scheme to activate.
   */
  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // Storage unavailable — selection will not survive a reload.
    }
  }

  /** Flips between light and dark. */
  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private apply(mode: ThemeMode): void {
    const root = document.documentElement;
    root.classList.toggle('wa-dark', mode === 'dark');
    root.classList.toggle('wa-light', mode === 'light');
    root.style.colorScheme = mode;
  }

  private readStoredMode(): ThemeMode {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}
