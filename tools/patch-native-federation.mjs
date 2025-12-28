import fs from 'node:fs';
import path from 'node:path';

/**
 * Parche para Angular 21 + @angular-architects/native-federation (18.x)
 * Evita que el build falle por el import interno:
 *   @angular-devkit/build-angular/src/utils/tailwind
 * (Ese path ya no existe en este setup; además aquí no necesitamos Tailwind en build,
 *  porque Tailwind se usa vía CDN en `index.html`.)
 */

const filePath = path.resolve(
  process.cwd(),
  'node_modules/@angular-architects/native-federation/src/utils/angular-esbuild-adapter.js'
);

if (!fs.existsSync(filePath)) {
  console.log(`[patch-native-federation] No existe: ${filePath} (skip)`);
  process.exit(0);
}

const before = fs.readFileSync(filePath, 'utf8');

const needle = 'const tailwind_1 = require("@angular-devkit/build-angular/src/utils/tailwind");';
if (!before.includes(needle)) {
  console.log('[patch-native-federation] Ya parcheado o cambió el upstream (skip)');
  process.exit(0);
}

const replacement = [
  'let tailwind_1;',
  'try {',
  '  tailwind_1 = require("@angular-devkit/build-angular/src/utils/tailwind");',
  '} catch (e) {',
  '  tailwind_1 = { findTailwindConfigurationFile: async () => undefined };',
  '}',
].join('\n');

const after = before.replace(needle, replacement);
fs.writeFileSync(filePath, after, 'utf8');
console.log('[patch-native-federation] Parche aplicado OK');


