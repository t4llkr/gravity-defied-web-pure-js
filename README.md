## Changes from upstream

This is a community port of [gravity-defied-web](https://github.com/yurkagon/gravity-defied-web) from TypeScript to plain JavaScript. Port date: 2026-09-23.

### What was changed

- **TypeScript → plain JS**: all 32 `.ts` modules transpiled to native ES modules (no build step, no Node.js toolchain required at runtime).
- **Build-free asset loading**: replaced Vite-specific `?url` imports with `new URL(..., import.meta.url)`; `index.css` is now linked from `index.html` instead of being imported from JS.
- **Fixed a startup hang** (`src/MenuManager.js`, `fillCanvasWithImage`): the menu background raster (`raster.png`) was drawn in a tiling loop before its dimensions were known, which dead-locked the main thread with a zero step. Added a not-loaded guard.
- **Added CORS-proxy fallback chain** (`src/PackManager.js`): the original code used a single hard-coded public proxy (now defunct, returns 401). Now it tries a local `/proxy/` endpoint first (see `server.py`), then falls back through a list of public CORS proxies, trying both encoded and raw URL formats.
- **Added `server.py`**: a zero-dependency Python static server (stdlib only) that serves the game with `Cache-Control: no-store` and proxies gdmod.ru requests server-side to bypass CORS when hosting locally.

### License

The original project is GPL-2.0. This port is a derivative work and remains GPL-2.0 — see [LICENSE.md](LICENSE.md).
