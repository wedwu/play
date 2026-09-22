import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

/**
 * Root application providers.
 *
 * Zoneless change detection is used deliberately: Web Awesome components emit
 * native DOM events, which zone.js would otherwise monkey-patch on the way
 * through. Signals plus explicit event bindings make the data flow easier to
 * follow and avoid the patched-event edge cases custom elements can hit.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
    ),
  ],
};
