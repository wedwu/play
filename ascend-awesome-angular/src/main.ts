import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';
import { initWebAwesome } from './app/core/web-awesome';

// Point Web Awesome at the statically served asset tree before the first
// component renders. See scripts/sync-wa-assets.mjs for how it gets there.
initWebAwesome();

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  console.error('Failed to bootstrap AscendAwesome Angular:', error);
});
