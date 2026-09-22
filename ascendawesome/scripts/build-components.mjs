// Generates dist/components/<name>.js — thin re-exports that register
// Web Awesome custom elements. Client apps cherry-pick these:
//   import '@ascend/ascendawesome/components/button';
//
// APPROVED_COMPONENTS is the curation point: only components listed here
// are exposed to client apps. Add a name to ship it; omit to withhold it.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const APPROVED_COMPONENTS = [
  'button',
  'card',
  'checkbox',
  'dialog',
  'icon',
  'input',
  'select',
  // TODO: extend with the full Ascend-approved set
];

const WA_COMPONENTS_DIR = 'node_modules/@awesome.me/webawesome/dist/components';
const OUT_DIR = 'dist/components';

await mkdir(OUT_DIR, { recursive: true });

for (const name of APPROVED_COMPONENTS) {
  const waPath = join(WA_COMPONENTS_DIR, name, `${name}.js`);
  try {
    await access(waPath);
  } catch {
    console.error(`✗ Web Awesome has no component "${name}" (${waPath})`);
    process.exitCode = 1;
    continue;
  }
  const source = `// Registers <wa-${name}> (side effect). Generated — do not edit.
import '@awesome.me/webawesome/dist/components/${name}/${name}.js';
`;
  await writeFile(join(OUT_DIR, `${name}.js`), source);
  console.log(`✓ components/${name}.js`);
}
