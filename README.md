# Gravity Defied — pure JavaScript port

Browser port of the J2ME classic **Gravity Defied** (moto-trial racing). This repository is a community fork of [yurkagon/gravity-defied-web](https://github.com/yurkagon/gravity-defied-web), converted from TypeScript/Vite to plain JavaScript with **no build step and no Node.js toolchain** at runtime or deploy time.

## Changes from upstream

Port date: 2026-09-23 → 2026-09-24. All 32 `.ts` modules transpiled to native ES modules.

**Build & runtime**
- TypeScript → plain JS; no bundler, no `node_modules`, native ES modules in the browser.
- Replaced Vite-specific `?url` asset imports with `new URL(..., import.meta.url)`; `index.css` is linked from `index.html`.

**Stability fixes**
- Fixed a startup hang (`MenuManager.js`, `fillCanvasWithImage`): the menu background raster was tiled in a loop before load, dead-locking the main thread with a zero step; added a not-loaded guard.
- Fixed an infinite loop in physics (`GamePhysics.js`, `solvePhysicsStep`): the bisection loop was missing the original algorithm's `|window| < 65 → return 5` termination guard — a bike stuck below the track (fell out of the map) freezed the tab. Restored 1:1 from the decompiled original (`_uII` in evgenyzinoviev/gravitydefied).
- Wired the previously dead `saveAndClose()` to `pagehide` so settings/progress flush when the tab closes.

**Level packs**
- Pack switching actually takes effect: `GamePhysics` now receives the new `LevelLoader` (previously only the menu saw the new pack, gameplay kept the original).
- The original pack is listed in Cached Packs as **Original levels**, so you can always switch back.
- Downloaded packs are hidden from the Browse list (it shows only what you can still download).
- Cached Packs list shows per-pack progress (`12/30 tr 2/4 lg`).
- CORS handling: multi-proxy fallback chain with both URL formats; local `/proxy/` first, your own Cloudflare Worker on public hosting.
- Static `levelOffsetInFile` table converted to a per-instance field — switching packs back and forth no longer reads levels with wrong offsets (division-by-zero crashes).

**Per-pack persistence**
- Progress (unlocked leagues/difficulties/tracks), per-track records, last selected difficulty/track/league and per-difficulty track cache are stored **per pack** (`gd-progress-<id>` + pack-prefixed record stores) — switching packs no longer mixes or resets progress.
- League/difficulty unlocks now update the persisted fields (originally only the UI widget was updated; a refresh "forgot" the unlock while keeping the selection).
- Selection is saved on every actual change (start, navigation, finish auto-advance, league/difficulty/track picks) — not only on pack switch.
- Last active pack is remembered across page reloads and restored on startup; a missing pack binary falls back to original levels.

## License

The original project is GPL-2.0. This port is a derivative work and remains GPL-2.0 — see [LICENSE.md](LICENSE.md).
