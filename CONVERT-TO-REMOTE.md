## Instrucciones para IA (Google AI Studio): Convertir cualquier Angular a Microfrontend Remote (Native Federation)

Este documento está escrito para que lo copies/pegues dentro de Google AI Studio (o cualquier IA) y la IA pueda ejecutar **paso por paso** la conversión de un proyecto Angular a **Remote** consumible por un **Shell**.

### Qué arquitectura usa este repo

- **Patrón `RemoteMount`**: el Shell NO importa componentes del Remote como rutas Angular.
- El Shell carga un módulo remoto `./Bootstrap` y llama funciones:
  - `mount(hostElement)`
  - `unmount()`

Eso hace que el acoplamiento sea mínimo: el Remote se “inyecta” dentro del DOM del Shell.

---

## 0) Datos que la IA debe pedirte (o decidir con defaults)

Antes de hacer cambios, la IA debe definir:

- **`REMOTE_ID`**: string único, ej: `financiero`, `reportes`, `kpis`
- **Selector del remoto** (único): `app-<REMOTE_ID>-mfe` (ej: `app-financiero-mfe`)
- **Puerto DEV para servir el Remote (recomendado)**: 420N (ej: 4203) usando `mf:serve` (servidor estático de `dist/`)
- **Ruta en Shell**: `routePath` (ej: `financiero`)

---

## 1) Requisitos (versiones recomendadas)

- Node 20+
- Angular 21
- TypeScript (idealmente \(>= 5.9 < 6.0\))
- Native Federation (match con Angular): `@angular-architects/native-federation` **^21.x**
- `es-module-shims` (requerido por Native Federation)

> Nota importante (compatibilidad): **Angular 21 + Native Federation 18.x no es compatible** en práctica
> (puede romper el build con errores de bundling/Angular compiler). Usa **NF 21.x**.

---

## 2) Instalar librerías (Remote)

En la raíz del Remote, asegurar (como `devDependencies`):

- `@angular-architects/native-federation`
- `@angular-devkit/build-angular`
- `es-module-shims`
- (si no existen) `@angular/cli`, `@angular/build`, `@angular/compiler-cli`

Comando recomendado (instala todo en una sola línea):

```bash
npm install -D @angular-architects/native-federation@^21 @angular-devkit/build-angular@^21 es-module-shims@^2
```

> Nota: en algunos proyectos AI Studio aparece `"type": "module"` en `package.json`.  
> **Para este setup, quítalo** (o el `federation.config.js` puede romper por `require` en Node).

### 2.1 Fix Windows (solo si falla el build con `oxc-parser`)

Si al ejecutar `npm run mf:build` ves un error como:

- `Cannot find module '@oxc-parser/binding-win32-x64-msvc'`

Instala explícitamente el binding:

```bash
npm install -D @oxc-parser/binding-win32-x64-msvc@0.8.0
```

---

## 3) Selector único (CRÍTICO)

Si tu root component usa `selector: 'app-root'`, cámbialo a un selector único:

- `selector: 'app-<REMOTE_ID>-mfe'`

Luego en `index.html`, cambia:

- `<app-root></app-root>`
- por `<app-<REMOTE_ID>-mfe></app-<REMOTE_ID>-mfe>`

Esto evita choque con el Shell (que casi siempre usa `app-root`).

---

## 4) Crear/ajustar archivos MF en `src/` (Remote)

### 4.1 `src/main.ts`

Crear (o reemplazar) con:

```ts
import('./bootstrap').catch((err) => console.error(err));
```

### 4.2 `src/mount.ts`

Crear con una API estable de montaje:

```ts
import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

let appRef: ApplicationRef | null = null;
let componentRef: { destroy(): void } | null = null;

export async function mount(host: Element) {
  unmount();
  appRef = await createApplication({
    providers: [provideZonelessChangeDetection()],
  });
  componentRef = appRef.bootstrap(AppComponent as any, host);
}

export function unmount() {
  try {
    componentRef?.destroy();
  } finally {
    componentRef = null;
    appRef?.destroy();
    appRef = null;
  }
}
```

### 4.3 `src/bootstrap.ts`

Crear con:

- exporta `mount/unmount`
- hace `bootstrapApplication(...)` SOLO si existe el selector del Remote en el DOM

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app.component';

export { mount, unmount } from './mount';

const selectorExists = document.querySelector('app-<REMOTE_ID>-mfe');
if (selectorExists) {
  bootstrapApplication(AppComponent, {
    providers: [provideZonelessChangeDetection()],
  }).catch((err) => console.error(err));
}
```

> La IA debe reemplazar literalmente `app-<REMOTE_ID>-mfe` por el selector real (ej: `app-financiero-mfe`).

### 4.4 `src/remote-entry.ts` (opcional)

Crear:

```ts
export { AppComponent } from './app.component';
```

### 4.5 `tsconfig.json` (evitar warnings y asegurar type-check)

Asegura que el TS program incluya `src/**/*.ts` (para que `src/remote-entry.ts` sea type-checked):

```json
{
  "include": ["./index.tsx", "src/**/*.ts"]
}
```

Y evita aliases con `*` (wildcards) en `compilerOptions.paths` para no ver:
`Sharing mapped paths with wildcards (*) not supported`.

---

## 5) Crear `federation.config.js` (Remote)

En la raíz del proyecto Remote, crear `federation.config.js`:

```js
const { withNativeFederation, shareAll, DEFAULT_SKIP_LIST } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: '<REMOTE_ID>',

  exposes: {
    './Bootstrap': './src/bootstrap.ts',
    './Mount': './src/mount.ts',
    './Component': './src/remote-entry.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  // Build limpio en browser: evita “preparar/bundlear” paquetes node/devkit/angular como shared.
  skip: [
    ...DEFAULT_SKIP_LIST,
    (pkg) => pkg.startsWith('@angular/'),
    (pkg) => pkg.startsWith('@angular-devkit/'),
    // Ajusta según tu Remote (si aplica):
    '@google/genai',
    'tailwindcss',
    'vite',
    'typescript',
    'rxjs',
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],
});
```

La IA debe reemplazar `<REMOTE_ID>` por el ID real.

---

## 6) Ajustar `angular.json` (Remote)

### Objetivo
Tener dos “builds”:

- `app:esbuild:*` (Angular normal, rápido, **no se cuelga**)
- `app:build:*` (Native Federation wrapper que referencia el `target` esbuild)

### Recomendación práctica (la que usamos aquí)

- Crear `architect.esbuild` con `@angular/build:application`
- `architect.build` usa `@angular-architects/native-federation:build` pero SOLO con `target`
- `serve` sigue siendo `@angular/build:dev-server` apuntando a `app:esbuild:*`

### 6.1 Ejemplo exacto (copiar/pegar)

En `projects.app.architect`, renombra el `build` actual a `esbuild` (mismo contenido) y agrega un `build` nuevo:

```json
{
  "esbuild": {
    "builder": "@angular/build:application",
    "options": {
      "outputPath": { "base": "./dist", "browser": "." },
      "browser": "index.tsx",
      "styles": ["index.css"],
      "tsConfig": "tsconfig.json"
    },
    "configurations": {
      "production": { "outputHashing": "all" },
      "development": { "optimization": false, "extractLicenses": false, "sourceMap": true }
    },
    "defaultConfiguration": "production"
  },
  "build": {
    "builder": "@angular-architects/native-federation:build",
    "options": { "target": "app:esbuild:production" },
    "configurations": {
      "production": { "target": "app:esbuild:production" },
      "development": { "target": "app:esbuild:development" }
    },
    "defaultConfiguration": "production"
  },
  "serve": {
    "builder": "@angular/build:dev-server",
    "options": { "port": 3000 },
    "configurations": {
      "production": { "buildTarget": "app:esbuild:production" },
      "development": { "buildTarget": "app:esbuild:development" }
    },
    "defaultConfiguration": "development"
  }
}
```

---

## 7) `remoteEntry.json` para DEV vs PROD

### 7.1 DEV / Local (más limpio): servir `dist/` (sin proxy)

En práctica, **no necesitas proxy** si:

- construyes el Remote con Native Federation, y
- sirves el directorio `dist/` con cualquier servidor estático (incluyendo `remoteEntry.json`).

Pasos:

1) Build del Remote:

```bash
npm run mf:build
```

2) Servir `dist/` en un puerto (ej: 4203):

```bash
npm run mf:serve
```

Verifica:

- `http://localhost:4203/remoteEntry.json` responde **200**

> Nota: el Shell debe apuntar a ese `remoteEntry.json`.

### 7.2 PROD / Deploy estático

El build de Native Federation ya genera `dist/remoteEntry.json`. Asegúrate de publicar TODO el contenido de `dist/`.

---

## 8) Scripts recomendados en `package.json` (Remote)

Agregar:

### 8.1 Scripts mínimos (copy/paste)

```json
{
  "scripts": {
    "dev": "ng serve",
    "build": "ng run app:esbuild:production",
    "mf:build": "ng run app:build:production",
    "mf:serve": "node tools/serve-dist.mjs --dir dist --port 4203",
    "postinstall": "node tools/patch-native-federation.mjs"
  }
}
```

### 8.2 Archivo `tools/serve-dist.mjs` (servidor estático con CORS)

Crear `tools/serve-dist.mjs` para servir `dist/` y exponer `GET /remoteEntry.json`:

```js
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

function getArg(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const dirArg = getArg('--dir', 'dist');
const portArg = Number(getArg('--port', '4203'));
const rootDir = path.resolve(process.cwd(), dirArg);

if (!fs.existsSync(rootDir)) {
  console.error(`[mf:serve] No existe el directorio: ${rootDir}`);
  console.error(`[mf:serve] Primero ejecuta: npm run mf:build`);
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath);
  const rel = decoded.replace(/^\/+/, '');
  const full = path.resolve(base, rel);
  if (!full.startsWith(base)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  if (req.method !== 'GET') return res.writeHead(405).end('Method Not Allowed');

  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = safeJoin(rootDir, pathname);
  if (!filePath) return res.writeHead(400).end('Bad Request');
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return res.writeHead(404).end('Not Found');

  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
});

server.listen(portArg, '127.0.0.1', () => {
  console.log(`[mf:serve] Sirviendo ${rootDir}`);
  console.log(`[mf:serve] http://localhost:${portArg}/`);
  console.log(`[mf:serve] remoteEntry: http://localhost:${portArg}/remoteEntry.json`);
});
```

---

## 9) Parche automático (Angular 21 + Native Federation 18.2.x)

### 9) Parche automático (Angular 21 + Native Federation)

Si el builder NF falla por imports internos movidos (ej: Tailwind), agrega un postinstall con un parche.

Crear `tools/patch-native-federation.mjs`:

```js
import fs from 'node:fs';
import path from 'node:path';

// Evita fallo por import interno (dependiente de versiones):
//   @angular-devkit/build-angular/src/utils/tailwind
// Si no existe, usamos un stub (no necesitamos Tailwind en build si lo cargas por CDN).

const filePath = path.resolve(
  process.cwd(),
  'node_modules/@angular-architects/native-federation/src/utils/angular-esbuild-adapter.js'
);

if (!fs.existsSync(filePath)) {
  console.log(`[patch-native-federation] No existe: ${filePath} (skip)`);
  process.exit(0);
}

const before = fs.readFileSync(filePath, 'utf8');
const needle = 'const tailwind_1 = require(\"@angular-devkit/build-angular/src/utils/tailwind\");';
if (!before.includes(needle)) {
  console.log('[patch-native-federation] Ya parcheado o upstream cambió (skip)');
  process.exit(0);
}

const replacement = [
  'let tailwind_1;',
  'try {',
  '  tailwind_1 = require(\"@angular-devkit/build-angular/src/utils/tailwind\");',
  '} catch (e) {',
  '  tailwind_1 = { findTailwindConfigurationFile: async () => undefined };',
  '}',
].join('\\n');

fs.writeFileSync(filePath, before.replace(needle, replacement), 'utf8');
console.log('[patch-native-federation] Parche aplicado OK');
```

Y en `package.json`:

- `postinstall`: `node tools/patch-native-federation.mjs`

---

## 10) Registrar el Remote en el Shell (1 solo cambio)

En el Shell edita:

- `backoffice-shell/src/assets/enable-mf.json`

Agrega una entrada:

- `id`: `<REMOTE_ID>`
- `displayName`: texto para el sidebar
- `routePath`: ej `financiero`
- `remoteEntry`: URL a `remoteEntry.json` (dev o prod)
- `mountModule`: `./Bootstrap`
- `enabled`: `true`

---

## 11) Verificación (lo que la IA debe pedirte comprobar)

### DEV
- `http://localhost:4203/remoteEntry.json` responde 200
- El Shell carga `/<routePath>` sin errores

### PROD / AI Studio
- `dist/` contiene `remoteEntry.json` y los JS referenciados dentro del JSON
- `dist/remoteEntry.json` existe
- Cada `outFileName` del `remoteEntry.json` existe dentro de `dist/`
- Desde el navegador:
  - `<URL_PUBLICA>/remoteEntry.json` responde 200
  - `<URL_PUBLICA>/<chunk-XXXX.js>` responde 200



