// Self-contained bundle for legacy/non-bundled apps (dist-cdn).
// Inlines Web Awesome + all approved components into one ESM file.
// Bundled apps should NOT use this — cherry-pick components instead.

export { setBasePath } from '@awesome.me/webawesome/dist/webawesome.js';

// Register every approved component (keep in sync with
// scripts/build-components.mjs APPROVED_COMPONENTS).
import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/checkbox/checkbox.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
