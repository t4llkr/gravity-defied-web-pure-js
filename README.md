## Changes from upstream

This is a community port of [gravity-defied-web](https://github.com/yurkagon/gravity-defied-web) from TypeScript to plain JavaScript. Port date: 2026-09-23.

### What was changed

- **TypeScript → plain JS**: all 32 `.ts` modules transpiled to native ES modules (no build step, no Node.js toolchain required at runtime).
- **Build-free asset loading**: replaced Vite-specific `?url` imports with `new URL(..., import.meta.url)`; `index.css` is now linked from `index.html` instead of being imported from JS.
- **Fixed a startup hang** (`src/MenuManager.js`, `fillCanvasWithImage`): the menu background raster (`raster.png`) was drawn in a tiling loop before its dimensions were known, which dead-locked the main thread with a zero step. Added a not-loaded guard.

### License

The original project is GPL-2.0. This port is a derivative work and remains GPL-2.0 — see [LICENSE.md](LICENSE.md).
