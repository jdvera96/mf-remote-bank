import fs from 'node:fs';
import path from 'node:path';

/**
 * Inyecta `dist/importmap.json` dentro de `dist/index.html` como:
 *   <script type="importmap-shim"> ... </script>
 *
 * Motivo:
 * En algunos entornos, `es-module-shims` no aplica correctamente
 * `<script type="importmap-shim" src="importmap.json"></script>`,
 * causando errores tipo:
 *   Unable to resolve specifier 'rxjs/operators'
 */

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const importmapPath = path.join(distDir, 'importmap.json');

if (!fs.existsSync(indexPath)) {
  console.error(`[inline-importmap] No existe: ${indexPath}`);
  process.exit(1);
}
if (!fs.existsSync(importmapPath)) {
  console.error(`[inline-importmap] No existe: ${importmapPath}`);
  process.exit(1);
}

const html = fs.readFileSync(indexPath, 'utf8');
const rawImportmapJson = fs.readFileSync(importmapPath, 'utf8').trim();

function needsDotSlash(v) {
  // Si ya es URL absoluta o relativa "correcta", no tocamos.
  return (
    typeof v === 'string' &&
    !v.startsWith('./') &&
    !v.startsWith('../') &&
    !v.startsWith('/') &&
    !v.startsWith('http://') &&
    !v.startsWith('https://') &&
    !v.startsWith('data:') &&
    !v.startsWith('blob:')
  );
}

let importmapObj;
try {
  importmapObj = JSON.parse(rawImportmapJson);
} catch (e) {
  console.error('[inline-importmap] importmap.json no es JSON válido');
  process.exit(1);
}

// Normalizamos los targets para que es-module-shims los trate como URLs relativas reales.
if (importmapObj?.imports && typeof importmapObj.imports === 'object') {
  for (const k of Object.keys(importmapObj.imports)) {
    const v = importmapObj.imports[k];
    if (needsDotSlash(v)) {
      importmapObj.imports[k] = `./${v}`;
    }
  }
}

const importmapJson = JSON.stringify(importmapObj, null, 2);

const re = /<script\s+type=["']importmap-shim["']\s+src=["']importmap\.json["']\s*>\s*<\/script>/i;
if (!re.test(html)) {
  console.error('[inline-importmap] No encontré el tag `<script type="importmap-shim" src="importmap.json"></script>` para reemplazar.');
  process.exit(1);
}

const injected =
  `<script type="importmap-shim">\n${importmapJson}\n</script>`;

const out = html.replace(re, injected);

// Limpieza: el builder puede inyectar el mismo esms-options más de una vez.
const esmsRe = /<script\s+type=["']esms-options["']>\s*\{\s*"shimMode"\s*:\s*true\s*\}\s*<\/script>/gi;
const matches = out.match(esmsRe) ?? [];
let cleaned = out;
if (matches.length > 1) {
  let seen = 0;
  cleaned = out.replace(esmsRe, (m) => {
    seen += 1;
    return seen === 1 ? m : '';
  });
}

fs.writeFileSync(indexPath, cleaned, 'utf8');
console.log('[inline-importmap] OK: importmap.json inyectado en dist/index.html');


