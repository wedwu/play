import type { Decorator, Preview } from '@storybook/angular';
import {
  type AssetSource,
  readStoredAssetSource,
  resolveAssetManifest,
  storeAssetSource,
} from '../src/app/core/asset-source';

// The NPM delivery path is the default, so its components are registered up
// front by importing the app's Web Awesome bootstrap module.
//
// Global stylesheets are not imported here: the Storybook builder inherits the
// `styles` and `stylePreprocessorOptions` arrays from the `build` target named
// in angular.json, so Web Awesome's base CSS and src/styles.scss are already
// applied to the preview.
import { initWebAwesome } from '../src/app/core/web-awesome';

initWebAwesome();

/** Attribute used to tag the stylesheets this decorator manages. */
const MANAGED_ATTRIBUTE = 'data-aa-asset-source';

/**
 * Swaps the AscendAwesome stylesheets to match the selected delivery source.
 *
 * Stylesheets can be exchanged at runtime; custom element *definitions* cannot
 * — `customElements.define()` is permanent for the life of the page. Switching
 * source therefore reloads the preview iframe so the newly selected scripts
 * register their own definitions from scratch.
 *
 * @param source - Delivery source selected in the toolbar.
 */
function applyAssetSource(source: AssetSource): void {
  const previous = readStoredAssetSource();
  document.querySelectorAll(`[${MANAGED_ATTRIBUTE}]`).forEach((node) => node.remove());

  const { styles, scripts, basePath } = resolveAssetManifest(source);

  for (const href of styles) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute(MANAGED_ATTRIBUTE, source);
    document.head.append(link);
  }

  for (const src of scripts) {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.setAttribute(MANAGED_ATTRIBUTE, source);
    document.head.append(script);
  }

  document.documentElement.dataset['aaAssetSource'] = source;
  document.documentElement.dataset['aaBasePath'] = basePath;

  if (previous !== source) {
    storeAssetSource(source);
    // Definitions from the previous source are already registered; only a fresh
    // document can load the other set cleanly.
    window.location.reload();
  }
}

/** Applies the toolbar's delivery-source selection before each story renders. */
const withAssetSource: Decorator = (storyFn, context) => {
  applyAssetSource((context.globals['assetSource'] as AssetSource) ?? 'npm');
  return storyFn();
};

/** Applies the toolbar's light/dark selection. */
const withTheme: Decorator = (storyFn, context) => {
  const dark = context.globals['theme'] === 'dark';
  document.documentElement.classList.toggle('wa-dark', dark);
  document.documentElement.classList.toggle('wa-light', !dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  return storyFn();
};

const preview: Preview = {
  decorators: [withAssetSource, withTheme],
  globalTypes: {
    assetSource: {
      name: 'Asset source',
      description: 'Where AscendAwesome CSS and JS are loaded from',
      defaultValue: 'npm',
      toolbar: {
        icon: 'transfer',
        dynamicTitle: true,
        items: [
          { value: 'npm', title: 'NPM package', right: '@trustage/ascend-awesome' },
          { value: 'cdn', title: 'CDN (legacy)', right: '/lts/ pointer' },
        ],
      },
    },
    theme: {
      name: 'Theme',
      description: 'Colour scheme',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
  },
  parameters: {
    controls: { expanded: true },
    options: {
      storySort: {
        order: ['Introduction', 'Foundations', 'Components', 'Pages'],
      },
    },
  },
};

export default preview;
