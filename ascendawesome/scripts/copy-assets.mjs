// Copies Web Awesome runtime assets (icons, etc.) into dist-cdn/assets
// so the self-contained bundle works for non-bundled/legacy apps.
import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const SRC = 'node_modules/@awesome.me/webawesome/dist/assets';
const DEST = 'dist-cdn/assets';

await mkdir('dist-cdn', { recursive: true });

if (existsSync(SRC)) {
  await cp(SRC, DEST, { recursive: true });
  console.log(`✓ assets → ${DEST}`);
} else {
  console.warn(`⚠ ${SRC} not found — check Web Awesome's asset layout for this version`);
}
