/**
 * Web Awesome bootstrap: base path configuration and component registration.
 *
 * Two things have to happen before any `<wa-*>` tag renders:
 *
 * 1. {@link setBasePath} must point at the statically served copy of the Web
 *    Awesome `dist` tree (see `scripts/sync-wa-assets.mjs`). Icons and lazily
 *    resolved resources are fetched from this path at runtime.
 * 2. Each component's module must be imported so it calls
 *    `customElements.define()`. Importing is a side effect — the import
 *    statements below look unused to a reader but are load-bearing.
 *
 * Components are cherry-picked rather than loaded through
 * `webawesome.loader.js` (the autoloader). The autoloader fetches definitions
 * over the network on demand, which reintroduces a runtime network dependency;
 * explicit imports keep the build self-contained and tree-shakeable.
 *
 * @packageDocumentation
 */
import { setBasePath } from '@awesome.me/webawesome/dist/utilities/base-path.js';

// --- Form controls -------------------------------------------------------
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/button-group/button-group.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/color-picker/color-picker.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/number-input/number-input.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/otp-input/otp-input.js';
import '@awesome.me/webawesome/dist/components/radio/radio.js';
import '@awesome.me/webawesome/dist/components/radio-group/radio-group.js';
import '@awesome.me/webawesome/dist/components/rating/rating.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import '@awesome.me/webawesome/dist/components/tag-input/tag-input.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/time-input/time-input.js';

// --- Data display --------------------------------------------------------
import '@awesome.me/webawesome/dist/components/avatar/avatar.js';
import '@awesome.me/webawesome/dist/components/badge/badge.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/carousel/carousel.js';
import '@awesome.me/webawesome/dist/components/carousel-item/carousel-item.js';
import '@awesome.me/webawesome/dist/components/comparison/comparison.js';
import '@awesome.me/webawesome/dist/components/format-bytes/format-bytes.js';
import '@awesome.me/webawesome/dist/components/format-date/format-date.js';
import '@awesome.me/webawesome/dist/components/format-number/format-number.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import '@awesome.me/webawesome/dist/components/progress-ring/progress-ring.js';
import '@awesome.me/webawesome/dist/components/qr-code/qr-code.js';
import '@awesome.me/webawesome/dist/components/relative-time/relative-time.js';
import '@awesome.me/webawesome/dist/components/skeleton/skeleton.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/tag/tag.js';
import '@awesome.me/webawesome/dist/components/tree/tree.js';
import '@awesome.me/webawesome/dist/components/tree-item/tree-item.js';

// --- Overlays and feedback ----------------------------------------------
import '@awesome.me/webawesome/dist/components/callout/callout.js';
import '@awesome.me/webawesome/dist/components/copy-button/copy-button.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/drawer/drawer.js';
import '@awesome.me/webawesome/dist/components/popover/popover.js';
import '@awesome.me/webawesome/dist/components/toast/toast.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';

// --- Navigation and layout ----------------------------------------------
import '@awesome.me/webawesome/dist/components/accordion/accordion.js';
import '@awesome.me/webawesome/dist/components/accordion-item/accordion-item.js';
import '@awesome.me/webawesome/dist/components/breadcrumb/breadcrumb.js';
import '@awesome.me/webawesome/dist/components/breadcrumb-item/breadcrumb-item.js';
import '@awesome.me/webawesome/dist/components/divider/divider.js';
import '@awesome.me/webawesome/dist/components/dropdown/dropdown.js';
import '@awesome.me/webawesome/dist/components/dropdown-item/dropdown-item.js';
import '@awesome.me/webawesome/dist/components/pagination/pagination.js';
import '@awesome.me/webawesome/dist/components/scroller/scroller.js';
import '@awesome.me/webawesome/dist/components/split-panel/split-panel.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab-panel/tab-panel.js';

/**
 * Default location the app serves the Web Awesome asset tree from.
 *
 * Kept in sync with `scripts/sync-wa-assets.mjs`, which copies
 * `node_modules/@awesome.me/webawesome/dist` to `public/wa-assets`.
 */
export const WA_ASSET_BASE_PATH = '/wa-assets';

/**
 * Configures Web Awesome's runtime asset resolution.
 *
 * Call once during application bootstrap, before the first `<wa-*>` element is
 * rendered.
 *
 * @param basePath - Path the Web Awesome `dist` tree is served from. Defaults
 * to {@link WA_ASSET_BASE_PATH}.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, appConfig).then(() => initWebAwesome());
 * ```
 */
export function initWebAwesome(basePath: string = WA_ASSET_BASE_PATH): void {
  setBasePath(basePath);
}
