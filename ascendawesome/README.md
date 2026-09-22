# @ascend/ascendawesome

AscendAwesome design system — the Ascend theme and a curated set of components, built on [Web Awesome](https://webawesome.com) web components.

The package pins `@awesome.me/webawesome` to an **exact** version, so every app on the same AscendAwesome version runs identical components.

## Install

```sh
npm install @ascend/ascendawesome
```

Requires the `@ascend` scope pointed at the internal registry (see `.npmrc`).

## Usage

```js
// App entry point
import '@ascend/ascendawesome/css';                    // Ascend theme (includes Web Awesome base styles)
import { setBasePath } from '@ascend/ascendawesome';

setBasePath('/static/ascendawesome/');                 // where runtime assets (icons) are served

// Cherry-pick only the components you use — smallest bundles
import '@ascend/ascendawesome/components/button';
import '@ascend/ascendawesome/components/dialog';
```

```html
<wa-button variant="brand">Ascend</wa-button>
```

ESM only — there is no CJS build (Web Awesome and Lit are ESM-only).

### Runtime assets

Icons load at runtime from the base path. Copy the assets to your static pipeline as a build step, e.g.:

```sh
cp -r node_modules/@awesome.me/webawesome/dist/assets public/static/ascendawesome
```

### Non-bundled / legacy apps

Serve `dist-cdn/` (self-contained bundle + assets) from your static pipeline:

```html
<link rel="stylesheet" href="/assets/ascendawesome/ascend.min.css">
<script type="module" src="/assets/ascendawesome/ascendawesome.bundle.js"></script>
```

## Versioning

Strict semver. A Web Awesome major upgrade is always an AscendAwesome major. Install channels via dist-tags:

```sh
npm install @ascend/ascendawesome@latest   # current stable
npm install @ascend/ascendawesome@lts      # maintenance line (replaces the CDN /lts/ pointer)
```

## Development

```sh
npm ci
npm run build        # theme CSS, component re-exports, dist-cdn bundle
npm run pack:check   # verify what would be published
```

The approved component list lives in `scripts/build-components.mjs` — components not listed there are not exposed to client apps.

## Releasing

Push a `vX.Y.Z` tag; CI builds, verifies, and publishes (see `.github/workflows/release.yml`). Do not run `npm publish` locally.
