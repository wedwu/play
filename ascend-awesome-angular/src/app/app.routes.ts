import { Routes } from '@angular/router';

/**
 * Description of a demo page, used to build the sidebar navigation.
 */
export interface DemoPageLink {
  /** Router path, without a leading slash. */
  readonly path: string;
  /** Label shown in the sidebar. */
  readonly label: string;
  /** Web Awesome icon name rendered beside the label. */
  readonly icon: string;
  /** One-line summary shown on the page header. */
  readonly summary: string;
}

/**
 * Navigation model for the demo pages.
 *
 * Kept next to {@link routes} so a new page only has to be registered once.
 */
export const DEMO_PAGES: readonly DemoPageLink[] = [
  {
    path: 'forms',
    label: 'Forms',
    icon: 'keyboard',
    summary: 'Inputs, selection controls and validation wired into Angular forms.',
  },
  {
    path: 'data-display',
    label: 'Data display',
    icon: 'table-list',
    summary: 'Cards, badges, avatars, progress and formatting primitives.',
  },
  {
    path: 'overlays',
    label: 'Overlays & feedback',
    icon: 'window-restore',
    summary: 'Dialogs, drawers, tooltips, popovers, callouts and toasts.',
  },
  {
    path: 'navigation',
    label: 'Navigation & layout',
    icon: 'compass',
    summary: 'Tabs, accordions, breadcrumbs, dropdowns, pagination and panels.',
  },
  {
    path: 'kitchen-sink',
    label: 'Kitchen sink',
    icon: 'grid-2',
    summary: 'Compact gallery of the remaining Web Awesome components.',
  },
];

/** Application routes. Every page is lazily loaded. */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'forms' },
  {
    path: 'forms',
    title: 'Forms · AscendAwesome',
    loadComponent: () => import('./pages/forms/forms-page').then((m) => m.FormsPage),
  },
  {
    path: 'data-display',
    title: 'Data display · AscendAwesome',
    loadComponent: () =>
      import('./pages/data-display/data-display-page').then((m) => m.DataDisplayPage),
  },
  {
    path: 'overlays',
    title: 'Overlays & feedback · AscendAwesome',
    loadComponent: () => import('./pages/overlays/overlays-page').then((m) => m.OverlaysPage),
  },
  {
    path: 'navigation',
    title: 'Navigation & layout · AscendAwesome',
    loadComponent: () => import('./pages/navigation/navigation-page').then((m) => m.NavigationPage),
  },
  {
    path: 'kitchen-sink',
    title: 'Kitchen sink · AscendAwesome',
    loadComponent: () =>
      import('./pages/kitchen-sink/kitchen-sink-page').then((m) => m.KitchenSinkPage),
  },
  { path: '**', redirectTo: 'forms' },
];
