// Галерея левелпаков: DOM-оверлей по аналогии со скинами.
// Catalog — окно 200 с сервера, страницы по 20; Saved — кэш + Original levels.
// Прогресс: по РЕКОРДАМ с проверкой валидного времени (не факт открытия трассы).
let activePackGallery = null;

export function closePackGallery() {
  if (activePackGallery !== null) {
    activePackGallery();
    activePackGallery = null;
  }
}

// [пройденоE, пройденоM, пройденоH] — по record store'ам с ненулевым содержимым
function countCompletedPerDifficulty(packId) {
  const P = "gravity_defied_record_store:";
  const prefix = packId === 0 ? "" : "p" + packId + "_";
  const counts = [0, 0, 0];
  for (let i = 0; i < window.localStorage.length; ++i) {
    const key = window.localStorage.key(i);
    if (key === null || !key.startsWith(P)) {
      continue;
    }
    const name = key.substring(P.length);
    if (name === "GWTRStates") {
      continue;
    }
    let diffChar;
    if (packId === 0) {
      if (!/^[0-9]/.test(name)) {
        continue;
      }
      diffChar = name[0];
    } else {
      if (!name.startsWith(prefix)) {
        continue;
      }
      diffChar = name[prefix.length];
    }
    const d = diffChar.charCodeAt(0) - 48;
    if (d < 0 || d > 2) {
      continue;
    }
    if (recordHasData(key)) {
      ++counts[d];
    }
  }
  return counts;
}
// record store хранит JSON-массив записей ([[байты], ...]); содержимое появляется
// только при записи результата (финише) — пустые/просмотренные store дают нули.
// Формат совместим и с обёрткой {data: [...]}.
function recordHasData(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) {
      return false;
    }
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed) ? parsed : parsed?.data;
    if (!Array.isArray(records)) {
      return false;
    }
    return records.some((rec) => Array.isArray(rec) && rec.some((b) => b !== 0));
  } catch {
    return false;
  }
}

const LETTERS = ["E", "M", "H"];

export function openPackGallery(menuManager, packMenu) {
  closePackGallery();
  const pm = packMenu.packManager;
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;z-index:900;background:rgba(10,10,14,0.96);display:flex;flex-direction:column;font-family:sans-serif;color:#ddd;";

  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:16px;padding:12px 20px;border-bottom:1px solid #333;";
  const title = document.createElement("span");
  title.textContent = "Level Packs";
  title.style.cssText = "font-size:20px;font-weight:bold;";
  const tabCatalog = document.createElement("button");
  const tabSaved = document.createElement("button");
  const spacer = document.createElement("span");
  spacer.style.flex = "1";
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  const btnCss = "padding:6px 14px;border:1px solid #555;background:#222;color:#ccc;cursor:pointer;border-radius:4px;font-size:14px;";
  closeBtn.style.cssText = btnCss;
  closeBtn.onclick = () => closePackGallery();
  header.append(title, tabCatalog, tabSaved, spacer, closeBtn);
  const body = document.createElement("div");
  body.style.cssText = "flex:1;overflow-y:auto;padding:16px 20px;";
  overlay.append(header, body);
  document.body.appendChild(overlay);

  let tab = "catalog";
  let catalogPage = 1;
  const PAGE = 50;
  let lastRawCount = -1;
  let busyId = null;

  const setTabs = () => {
    tabCatalog.style.cssText = btnCss + (tab === "catalog" ? "background:#3a6ea5;color:#fff;" : "");
    tabSaved.style.cssText = btnCss + (tab === "saved" ? "background:#3a6ea5;color:#fff;" : "");
  };
  tabCatalog.textContent = "Catalog";
  tabSaved.textContent = "Saved";
  tabCatalog.onclick = () => { tab = "catalog"; setTabs(); renderCatalog(); };
  tabSaved.onclick = () => { tab = "saved"; setTabs(); renderSaved(); };

  function clearBody() {
    body.innerHTML = "";
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:absolute;top:14px;left:50%;transform:translateX(-50%);background:#274;color:#dfe;border:1px solid #4a6;padding:8px 18px;border-radius:6px;font-size:14px;z-index:5;";
    overlay.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }
  function grid() {
    const g = document.createElement("div");
    g.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;";
    return g;
  }
  // карточка пака: название / уровни / автор; progressRows — массив {letter, done, total}.
  // borderState: "current" (зелёная), "completed" (синяя — пройден полностью), иначе серая.
  function card(name, sub, author, borderState, onClick, badge, extra, progressRows) {
    const borderColor = borderState === "current" ? "#5a5" : borderState === "completed" ? "#39c" : "#444";
    const t = document.createElement("div");
    t.style.cssText = "display:flex;flex-direction:column;gap:5px;padding:12px;border:1px solid " + borderColor + ";border-radius:6px;cursor:pointer;background:#181820;";
    const n = document.createElement("div");
    n.textContent = (badge ? badge + " " : "") + name;
    n.style.cssText = "font-size:14px;font-weight:bold;word-break:break-word;";
    t.appendChild(n);
    if (sub) {
      const s = document.createElement("div");
      s.textContent = sub;
      s.style.cssText = "font-size:12px;color:#aaa;";
      t.appendChild(s);
    }
    if (author) {
      const a = document.createElement("div");
      a.textContent = author;
      a.style.cssText = "font-size:11px;color:#888;";
      t.appendChild(a);
    }
    if (progressRows) {
      for (const row of progressRows) {
        const line = document.createElement("div");
        line.style.cssText = "display:flex;align-items:center;gap:8px;margin-top:2px;";
        const letter = document.createElement("span");
        letter.textContent = row.letter;
        letter.style.cssText = "font-size:11px;width:14px;color:#bbb;";
        const barWrap = document.createElement("div");
        barWrap.style.cssText = "flex:1;height:6px;background:#333;border-radius:3px;overflow:hidden;";
        const fill = document.createElement("div");
        const pct = row.total > 0 ? Math.round(row.done / row.total * 100) : 0;
        fill.style.cssText = "height:100%;width:" + pct + "%;background:#4a8;";
        barWrap.appendChild(fill);
        const cnt = document.createElement("span");
        cnt.textContent = row.total > 0 ? row.done + "/" + row.total : String(row.done);
        cnt.style.cssText = "font-size:11px;color:#bbb;width:52px;text-align:right;";
        line.append(letter, barWrap, cnt);
        t.appendChild(line);
      }
    }
    if (extra) {
      const e = document.createElement("div");
      e.textContent = extra;
      e.style.cssText = "font-size:11px;color:#fc6;";
      t.appendChild(e);
    }
    t.onclick = onClick;
    return t;
  }

  async function renderCatalog() {
    clearBody();
    const g = grid();
    body.appendChild(g);
    const status = document.createElement("div");
    status.style.cssText = "text-align:center;color:#888;font-size:13px;";
    const pager = document.createElement("div");
    pager.style.cssText = "display:flex;gap:14px;align-items:center;justify-content:center;padding:14px;";
    body.appendChild(pager);
    let cachedIds = new Set();
    try {
      cachedIds = new Set((await pm.getCachedPacks()).map((m) => m.id));
    } catch {
    }
    status.textContent = "Loading...";
    let items = [];
    try {
      items = await pm.getUiPage(catalogPage, PAGE);
    } catch {
      items = [];
    }
    const rawCount = pm.lastSliceRawCount ?? items.length;
    const visible = items.filter((it) => !cachedIds.has(it.id));
    const hidden = items.length - visible.length;
    status.textContent = items.length === 0 && catalogPage === 1
      ? "Failed to load catalog (check connection / proxy)"
      : `Page ${catalogPage} — ${visible.length} packs` + (hidden > 0 ? ` (${hidden} saved, see Saved tab)` : "");
    for (const it of visible) {
      const borderState = menuManager.currentPackId === it.id ? "current" : "";
      const sub = [it.levels, it.mrgSize].filter(Boolean).join(" · ");
      const busy = busyId === it.id;
      g.appendChild(card(it.name, sub, it.author, borderState, async () => {
        if (busyId !== null) {
          return;
        }
        busyId = it.id;
        renderCatalog();
        let ok = false;
        try {
          await packMenu.downloadAndLoadPack(it);
          ok = true;
        } catch {
        }
        busyId = null;
        renderCatalog();
        if (ok) {
          toast("Saved! Find it in the Saved tab");
        }
      }, "", busy ? "Downloading..." : "", null));
    }
    const mkBtn = (label, onClick, disabled) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = btnCss + (disabled ? "opacity:0.4;cursor:default;" : "");
      if (!disabled) {
        b.onclick = onClick;
      }
      return b;
    };
    pager.append(
      mkBtn("◀ Prev", () => { if (catalogPage > 1) { catalogPage--; renderCatalog(); } }, catalogPage <= 1),
      status,
      mkBtn("Next ▶", () => { if (rawCount === PAGE) { catalogPage++; renderCatalog(); } }, rawCount < PAGE)
    );
  }

  async function renderSaved() {
    clearBody();
    const g = grid();
    body.appendChild(g);
    const currentId = menuManager.currentPackId;
    // дефолтный пак первой карточкой
    const origTotals = (() => {
      try {
        const lvls = packMenu.originalLoader?.levelNames;
        return lvls ? lvls.map((l) => l.length) : null;
      } catch {
        return null;
      }
    })();
    const origDone = countCompletedPerDifficulty(0);
    const origRows = origTotals
      ? LETTERS.map((letter, i) => ({ letter, done: origDone[i], total: origTotals[i] }))
      : LETTERS.map((letter, i) => ({ letter, done: origDone[i], total: 0 }));
    const origDoneAll = origRows.every((r) => r.total > 0 && r.done >= r.total);
    const origState = currentId === 0 ? "current" : origDoneAll ? "completed" : "";
    g.appendChild(card("Original levels", null, "built-in", origState, async () => {
      await packMenu.onCachedPackSelected({ id: 0, name: "Original levels", author: "built-in", levels: "", mrgSize: "", hasGdlvl: false });
      renderSaved();
    }, "", "", origRows));
    let saved = [];
    try {
      saved = await pm.getCachedPacks();
    } catch {
    }
    saved.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    for (const meta of saved) {
      const done = countCompletedPerDifficulty(meta.id);
      const totals = Array.isArray(meta.levelsBreakdown) ? meta.levelsBreakdown : null;
      const rows = LETTERS.map((letter, i) => ({ letter, done: done[i], total: totals ? totals[i] : 0 }));
      const doneAll = totals !== null && rows.every((r) => r.total > 0 && r.done >= r.total);
      const state = currentId === meta.id ? "current" : doneAll ? "completed" : "";
      g.appendChild(card(meta.name, null, meta.author || "gdmod.ru", state, async () => {
        await packMenu.onCachedPackSelected({ id: meta.id, name: meta.name, author: meta.author, levels: "", mrgSize: "", hasGdlvl: false });
        renderSaved();
      }, "", "", rows));
    }
    if (saved.length === 0) {
      const hint = document.createElement("div");
      hint.textContent = "No saved packs yet — download from the Catalog tab.";
      hint.style.cssText = "grid-column:1/-1;text-align:center;color:#888;padding:20px;";
      g.appendChild(hint);
    }
  }

  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      closePackGallery();
    }
  };
  window.addEventListener("keydown", onKey, true);
  const cleanup = () => {
    window.removeEventListener("keydown", onKey, true);
    overlay.remove();
  };
  activePackGallery = cleanup;
  setTabs();
  renderCatalog();
}
