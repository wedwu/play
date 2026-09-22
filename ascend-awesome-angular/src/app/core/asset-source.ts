/**
 * Delivery-source switching for AscendAwesome assets.
 *
 * The design system is being migrated from a floating CDN pointer to a
 * versioned npm package. During the transition both paths must be testable
 * side by side, so the source is resolved at runtime rather than hard-coded.
 *
 * @packageDocumentation
 */

/**
 * Where the AscendAwesome CSS and JS are loaded from.
 *
 * - `npm` — resolved from the installed `@trustage/ascend-awesome` package and
 *   served from the app's own origin. The target state.
 * - `cdn` — the legacy floating `/lts/` pointer. Retained for parity testing
 *   until the CDN is retired.
 */
export type AssetSource = 'npm' | 'cdn';

/** Key used to persist the selected source across reloads. */
export const ASSET_SOURCE_STORAGE_KEY = 'aa-asset-source';

/** Base URL of the legacy CDN distribution. */
export const CDN_BASE_URL = 'https://cdn.example.com/ascendawesome/lts';

/**
 * Stylesheet and script URLs for a given delivery source.
 */
export interface AssetManifest {
  /** Stylesheets to inject, in order. */
  readonly styles: readonly string[];
  /** Scripts to inject as ES modules, in order. */
  readonly scripts: readonly string[];
  /** Base path passed to Web Awesome's `setBasePath()`. */
  readonly basePath: string;
}

/**
 * Resolves the asset URLs for a delivery source.
 *
 * @param source - Delivery source to resolve.
 * @returns The stylesheets, scripts and base path for that source.
 *
 * @example
 * ```ts
 * const { styles } = resolveAssetManifest('cdn');
 * // => ['https://cdn.example.com/ascendawesome/lts/trustage-aa.css', ...]
 * ```
 */
export function resolveAssetManifest(source: AssetSource): AssetManifest {
  if (source === 'cdn') {
    return {
      styles: [`${CDN_BASE_URL}/trustage-aa.css`, `${CDN_BASE_URL}/trustage-aa_sulsans.css`],
      scripts: [
        `${CDN_BASE_URL}/designsystem-webcomponents.js`,
        `${CDN_BASE_URL}/webawesome.loader.js`,
      ],
      basePath: CDN_BASE_URL,
    };
  }

  return {
    styles: ['/wa-assets/styles/webawesome.css'],
    scripts: [],
    basePath: '/wa-assets',
  };
}

/**
 * Reads the persisted delivery source.
 *
 * Falls back to `npm` when nothing is stored or storage is unavailable (for
 * example in a sandboxed iframe).
 *
 * @returns The stored source, or `npm`.
 */
export function readStoredAssetSource(): AssetSource {
  try {
    const stored = localStorage.getItem(ASSET_SOURCE_STORAGE_KEY);
    return stored === 'cdn' ? 'cdn' : 'npm';
  } catch {
    return 'npm';
  }
}

/**
 * Persists the delivery source.
 *
 * @param source - Source to remember for the next page load.
 */
export function storeAssetSource(source: AssetSource): void {
  try {
    localStorage.setItem(ASSET_SOURCE_STORAGE_KEY, source);
  } catch {
    // Storage unavailable — the selection simply will not survive a reload.
  }
}
