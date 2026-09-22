/**
 * Copies the Web Awesome `dist` tree into `public/wa-assets` so the app serves
 * component modules, chunks and icons from its own origin.
 *
 * Why this exists: `webawesome.loader.js` (the autoloader) resolves component
 * definitions at runtime from a configurable base path. Bundlers cannot see
 * those references, so the files must be served statically and pointed at with
 * `setBasePath()`. Skipping this step produces a build that compiles cleanly
 * but renders `<wa-*>` tags as empty elements with missing icons.
 *
 * Runs automatically via the `postinstall` npm script.
 */
import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const source = resolve(root, 'node_modules/@awesome.me/webawesome/dist');
const destination = resolve(root, 'public/wa-assets');

if (!existsSync(source)) {
  console.error(`[sync-wa-assets] Web Awesome not installed at ${source}. Run npm install first.`);
  process.exit(1);
}

await rm(destination, { recursive: true, force: true });
await mkdir(dirname(destination), { recursive: true });
await cp(source, destination, { recursive: true });

const { size } = await stat(destination);
console.log(
  `[sync-wa-assets] copied Web Awesome dist -> public/wa-assets (${size} bytes dir entry)`,
);
