# Gravity Defied — pure JavaScript port

Browser port of the J2ME classic **Gravity Defied** (moto-trial racing). This repository is a community fork of [yurkagon/gravity-defied-web](https://github.com/yurkagon/gravity-defied-web), converted from TypeScript/Vite to plain JavaScript with **no build step and no Node.js toolchain**.

Beyond the port itself, the game has been extended with major features the original web version did not have: **level packs**, **skins** and **visual customization**.

## Level packs

The original web port shipped with only the built-in levels. This fork adds a full level-pack system backed by [gdmod.ru](https://gdmod.ru):

- **Pack gallery** (DOM overlay, mouse-driven): a **Catalog** tab browses the community catalog windowed (200 packs per request, 50 per page) with name / levels / author on every card; a **Saved** tab lists downloaded packs and the built-in **Original levels** fallback. Downloaded packs disappear from the Catalog; downloading shows a notice and moves the pack to Saved; the active pack is marked with a green border, fully completed ones with blue.
- **Per-pack progress** on Saved cards: three mini-bars (Easy / Medium / Hard) with counters of *finished* tracks (counted from track records, not merely unlocked).
- **Per-pack persistence**: unlocked leagues/difficulties/tracks, per-track records and your last selected difficulty/track/league are stored **per pack** — switching packs no longer mixes or resets anything, and the last active pack (with its full state) is restored on page reload. If a pack's binary is missing from the cache, the game falls back to the original levels with a notice.
- Catalog browsing is resilient to gdmod quirks: zero-based pagination, windows-1251 decoding, GDLVL-only entries (not playable here) excluded from display but counted for paging, and retry-on-truncated responses.

## Skins

The bike and rider graphics are skinnable, with a gallery equivalent to the pack one (**Catalog** / **Saved** tabs, thumbnails, paging):

- Skins are downloaded from gdmod.ru as ZIP archives and unpacked in the browser with a built-in reader (`DecompressionStream` — no dependencies); each skin replaces the game's sprite set (helmet, body parts, engine, fender, misc sprites).
- Downloaded skins are stored locally (IndexedDB), persist across sessions and apply instantly; the built-in **Default** skin is always available in Saved.

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
| `localStorage` | per-track records, per-pack progress/selection (`gd-progress-*`), last active pack/skin, visual settings (`gd-visual`), game settings |
| `IndexedDB` | downloaded level packs (`gdpacks`), downloaded skins and background image (`gdvisual`) |

Clearing site data wipes all progress and records.

## Changes from upstream

Port date: 2026-09-23 → 2026-09-25; all 32 `.ts` modules transpiled to native ES modules. Highlights, in general terms:

- **Runtime**: no bundler and no Node.js — native ES modules, Vite-isms replaced with standard web APIs.
- **Stability**: fixed a startup hang (background raster drawn before load) and an infinite loop in the physics bisection (a bike falling out of the map froze the tab) by restoring the original algorithm's termination guard; settings/progress now flush on tab close.
- **Level packs**: the whole subsystem described above — pack switching that actually reaches gameplay, per-pack records/progress/selection, last-pack restore, resilient catalog pagination, and the gallery UI.
- **Skins**: downloadable, locally cached, instantly switchable rider/bike skins with a gallery UI.
- **Persistence model**: progress, records and selections are keyed per pack; unlock state updates are persisted correctly (previously a refresh could "forget" an unlock while keeping the selection); clearing highscores is per-pack.
- **Visuals**: the customization system described above, with batched canvas paths so the effects cost nothing at 60 fps.

## License

The original project is GPL-2.0. This port is a derivative work and remains GPL-2.0 — see [LICENSE.md](LICENSE.md).
