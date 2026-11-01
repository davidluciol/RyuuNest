# Extensión de RyuuNest (F26)

Hace las peticiones de red de la web de RyuuNest (SPEC §10). La web corre los módulos en un Web Worker y toda su red pasa por esta extensión, **solo a los dominios que tú autorices**. Chrome/Edge y Firefox, Manifest V3.

## Compilar y cargar

```bash
pnpm --filter @ryuunest/extension build     # genera apps/extension/dist
```

- **Chrome / Edge:** `chrome://extensions` → activa «Modo de desarrollador» → «Cargar descomprimida» → carpeta `apps/extension/dist`.
- **Firefox (128 o superior):** `about:debugging#/runtime/this-firefox` → «Cargar complemento temporal» → `apps/extension/dist/manifest.json`.

## Usarla

1. Sirve la web en un origen que la extensión acepte: `http://localhost:5173` (`pnpm --filter @ryuunest/web dev`) o `http://localhost:4173` (`... preview`). Por ahora **solo `localhost`** (P-116); el origen de producción se añade cuando se decida dónde alojar la PWA.
2. Recarga la web **después** de instalar la extensión (el content script solo se inyecta en páginas que cargan tras instalarla).
3. Cuando un módulo, un repo o una imagen necesita un dominio nuevo, la web muestra un aviso. «Abrir extensión» abre la página de opciones, donde pulsas «Autorizar» y el navegador te pide confirmar. Sin autorización **no sale ninguna petición**.
4. «Quitar permiso» (en las mismas opciones) revoca un dominio.

La autorización es por **host exacto** (`cdn.sitio.org`, no `*.sitio.org`) y la extensión no envía ni guarda cookies.

## Comprobaciones

```bash
pnpm --filter @ryuunest/extension test        # manifiesto, fondo, puente, opciones y puertas de calidad
```

Los e2e con la extensión real usan el Chromium de Playwright (Chrome de marca ignora `--load-extension` desde la versión 137) y necesitan `pnpm --filter @ryuunest/extension build` antes:

```bash
PLAYWRIGHT_MODULE=<ruta a playwright> node apps/extension/tests/e2e/extension.cjs   # protocolo, cabeceras, sin autorización
PLAYWRIGHT_MODULE=<ruta a playwright> node apps/extension/tests/e2e/options.cjs     # página de opciones
# AC-10 con todo real (web servida con `pnpm --filter @ryuunest/web preview`; requiere openssl):
WEB_URL=http://localhost:4173 PLAYWRIGHT_MODULE=<ruta> node apps/web/tests/e2e/bridge.cjs
```

Playwright no puede pulsar el aviso de permisos del navegador, así que los e2e conceden de antemano `127.0.0.1` en una **copia** de `dist` (el `dist` real no concede nada). Esa autorización con el aviso real se prueba a mano (Chrome y Firefox).

## Pendiente

- Iconos (no hay arte final; el manifiesto va sin `icons`).
- Publicación en tiendas y origen de producción de la PWA.
- Probarla en un Firefox real (Playwright no carga extensiones en Firefox).
