import type { StorybookConfig } from '@storybook/angular';

/**
 * Storybook configuration.
 *
 * Stories live next to the code they document. `staticDirs` exposes `public/`
 * so the Web Awesome asset tree copied there by `scripts/sync-wa-assets.mjs` is
 * served at `/wa-assets` — the same path the application uses, which keeps the
 * NPM delivery mode identical in both environments.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|js)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  staticDirs: ['../public'],
  docs: {
    defaultName: 'Docs',
  },
};

export default config;
