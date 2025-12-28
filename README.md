# mf-remote-bank (Bancos del Perú) — Fase 1 (Levantar el proyecto)

Proyecto Angular (Angular CLI) para mostrar una tabla de bancos del Perú.

## Requisitos

- **Node.js**: recomendado **20+**
- **npm**: el que viene con Node

## Instalar

```bash
npm install
```

## Levantar en local

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Build (producción)

```bash
npm run build
```

Salida en `dist/`.

## Notas (sin errores/warnings)

- **TypeScript**: Angular 21 requiere **TypeScript 5.9+** (este proyecto usa `~5.9.2`).
- **Estilos**: existe `index.css` y se compila desde `angular.json` (opción `styles`).
- **API Key (opcional)**: si quieres que `BankService` consulte Gemini, define `API_KEY` en el entorno de ejecución que uses.  
  Si no existe `API_KEY`, el servicio devuelve una lista “fallback” para que el proyecto levante igual.
