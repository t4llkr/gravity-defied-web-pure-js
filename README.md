# Gravity Defied — pure JavaScript port

Browser port of the J2ME classic **Gravity Defied** (moto-trial racing). This repository is a community fork of [yurkagon/gravity-defied-web](https://github.com/yurkagon/gravity-defied-web), converted from TypeScript/Vite to plain JavaScript with **no build step and no Node.js toolchain**.

Beyond the port itself, the game has been extended with two major features that the original web version did not have: **level packs** and **visual customization**.

## Level packs

The original web port shipped with only the built-in levels. This fork adds a full level-pack system backed by [gdmod.ru](https://gdmod.ru):

- **Browse & download** community track packs directly from the game — a built-in pack browser with paging and a same-origin proxy.
- **Cached packs** are stored locally (IndexedDB) and listed with per-pack progress (`12/30 tr 2/4 lg`). Downloaded packs disappear from the Browse list; the built-in **Original levels** pack is always available in the Cached list as a fallback.
- **Per-pack progress**: unlocked leagues/difficulties/tracks, per-track records and your last selected difficulty/track/league are stored **per pack** — switching packs no longer mixes or resets anything, and the last active pack (with its full state) is restored on page reload. If a pack's binary is missing from the cache, the game falls back to the original levels with a notice.

## Visual customization

A **Visuals** section in the main menu (all settings global, stored in `gd-visual`, applied live):

- **Line color** — track lines (both perspective and flat rendering).
- **Text color** — in-game text including the stopwatch.
- **Background color** — game backdrop.
- **Track fill** — the track wall filled with a shade computed from each segment's slope; shading can be a **smooth gradient** or **fixed steps**; toggleable, own color.
- **Track curtain** — a solid layer from the track surface to the bottom of the screen (toggleable; flat/no-perspective mode shows the curtain only).
- **Background image** — any picture from your computer (fill / fit / tile modes, transparent pixels reveal the background color; GIF support included — animated via a built-in decoder, since browsers do not animate GIFs drawn to canvas).

## Save data

Everything is stored in the browser, **per origin** (`scheme + host + port`):

| Storage | Contents |
|---|---|
| `localStorage` | per-track records, per-pack progress/selection (`gd-progress-*`), last active pack (`gd-last-pack`), visual settings (`gd-visual`), game settings |
| `IndexedDB` | downloaded level packs, background image |

Clearing site data wipes all progress and records.

## Changes from upstream

Port date: 2026-09-23 → 2026-09-24; all 32 `.ts` modules transpiled to native ES modules. Highlights, in general terms:

- **Runtime**: no bundler and no Node.js — native ES modules, Vite-isms replaced with standard web APIs, plus a zero-dependency Python static server (`server.py`) with `Cache-Control: no-store` and a `/proxy/` endpoint for pack browsing.
- **Stability**: fixed a startup hang (background raster drawn before load) and an infinite loop in the physics bisection (a bike falling out of the map froze the tab) by restoring the original algorithm's termination guard; settings/progress now flush on tab close.
- **Level packs**: the whole subsystem described above — pack switching that actually reaches gameplay, per-pack records/progress/selection, last-pack restore, proxy fallback chain.
- **Persistence model**: progress, records and selections are keyed per pack; unlock state updates are persisted correctly (previously a refresh could "forget" an unlock while keeping the selection).
- **Visuals**: the customization system described above, with batched canvas paths so the effects cost nothing at 60 fps.

## License

The original project is GPL-2.0. This port is a derivative work and remains GPL-2.0 — see [LICENSE.md](LICENSE.md).
