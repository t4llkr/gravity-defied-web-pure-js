// Галерея левелпаков: вкладки gdmods / GDTR / Saved. Полностью локально —
// метаданные из data/*.json, файлы из data/*.zip (LocalArchive через PackManager).
// Синяя рамка карточки = 100% прохождения (все треки пройдены по рекордам).
import { PACK_SOURCES } from "./PackManager.js";

const LETTERS = ["E", "M", "H"];
const PAGE = 50;
const UI_KEY = "gd-catalog-ui";

const wrapCss = "position:fixed;inset:0;z-index:500;background:rgba(10,10,12,0.94);overflow:auto;";
const btnCss = "background:#22242a;border:1px solid #444;color:#eee;padding:8px 14px;border-radius:6px;cursor:pointer;font-size:14px;";
const tabCss = "background:#1b1d22;border:1px solid #3a3d45;color:#ccc;padding:8px 18px;border-radius:8px 8px 0 0;cursor:pointer;font-size:14px;";
const tabActiveCss = "background:#262a31;border-color:#5a5e68;color:#fff;font-weight:bold;";
const inputCss = "background:#1b1d22;border:1px solid #3a3d45;color:#ccc;padding:6px 8px;border-radius:6px;font-size:13px;";

let activePackGallery = null;

export function closePackGallery() {
  if (activePackGallery) {
    activePackGallery();
    activePackGallery = null;
  }
}

// Прогресс по сложностям: сколько треков пройдено.
// Имя хранилища рекорда формируется игрой как packPrefix + лига + трек
// (склейка без разделителя: "p42_115" = лига 1, трек 15; оригинал: "015").
// Лига — первая цифра суффикса; трек может быть любым (у больших паков "2693").
function countCompletedPerDifficulty(packId) {
  const storagePrefix = "gravity_defied_record_store:";
  const packPrefix = "p" + packId + "_";
  const counts = [0, 0, 0, 0];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(storagePrefix)) {
        continue;
      }
      const key = k.slice(storagePrefix.length);
      let suffix;
      if (packId === 0) {
        suffix = key;
      } else {
        if (!key.startsWith(packPrefix)) {
          continue;
        }
        suffix = key.slice(packPrefix.length);
      }
      if (!/^[0-9]{2,}$/.test(suffix)) {
        continue;
      }
      const league = suffix.charCodeAt(0) - 48;
      if (league < 0 || league > 3) {
        continue;
      }
      counts[league]++;
    }
  } catch {
  }
  return counts;
}

function recordHasData(packId) {
  const storagePrefix = "gravity_defied_record_store:";
  const packPrefix = "p" + packId + "_";
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(storagePrefix)) {
        continue;
      }
      const key = k.slice(storagePrefix.length);
      if (packId === 0 ? /^[0-9]{2,}$/.test(key) : key.startsWith(packPrefix)) {
        return true;
      }
    }
  } catch {
  }
  return false;
}

export function openPackGallery(menuManager, packMenu) {
  if (activePackGallery) {
    return;
  }
  const pm = packMenu.packManager;

  // ---- состояние UI (вкладка/сортировки/тоггл — персистентно) ----
  let uiState = { tab: "gdmods", sorts: {}, hideDl: {}, pages: {}, query: {} };
  try {
    const s = window.localStorage.getItem(UI_KEY);
    if (s) {
      uiState = { ...uiState, ...JSON.parse(s) };
    }
  } catch {
  }
  const saveUiState = () => {
    try {
      window.localStorage.setItem(UI_KEY, JSON.stringify(uiState));
    } catch {
    }
  };
  const TAB_SOURCES = { gdmods: "gdmod", gdtr: "gdtr" };
  // [ключ, подпись, направление по умолчанию] — направление переключается кликом
  const SORT_TYPES = {
    gdmods: [
      ["date", "Date", "desc"], ["downloads", "Downloads", "desc"], ["tracks", "Tracks", "desc"],
      ["name", "Name", "asc"], ["author", "Author", "asc"],
    ],
    gdtr: [
      ["date", "Date", "desc"], ["tracks", "Tracks", "desc"], ["name", "Name", "asc"], ["author", "Author", "asc"],
    ],
    saved: [
      ["progress", "% completed", "desc"], ["saved", "Saved date", "desc"],
      ["name", "Name", "asc"], ["tracks", "Tracks", "desc"], ["source", "Source", "asc"],
    ],
  };
  const DEFAULT_SORT = { gdmods: "date_desc", gdtr: "date_desc", saved: "progress_desc" };
  const currentSort = () => uiState.sorts[uiState.tab] || DEFAULT_SORT[uiState.tab];
  const currentPage = () => uiState.pages[uiState.tab] || 1;
  const setPage = (p) => { uiState.pages[uiState.tab] = p; saveUiState(); };

  let busyId = null;

  const overlay = document.createElement("div");
  overlay.style.cssText = wrapCss;

  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:flex-end;gap:6px;padding:18px 20px 0;flex-wrap:wrap;";
  overlay.appendChild(header);

  const controls = document.createElement("div");
  controls.style.cssText = "display:flex;gap:12px;align-items:center;padding:10px 24px;flex-wrap:wrap;";
  overlay.appendChild(controls);

  const body = document.createElement("div");
  body.style.cssText = "padding:10px 24px 40px;";
  overlay.appendChild(body);

  // вкладки
  const tabs = {};
  for (const [tabId, label] of [["gdmods", "gdmod"], ["gdtr", "GDTR"], ["saved", "Saved"]]) {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = tabCss;
    b.onclick = () => { uiState.tab = tabId; saveUiState(); setTabs(); render(); };
    tabs[tabId] = b;
    header.appendChild(b);
  }
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = btnCss + "margin-left:auto;border-radius:8px;";
  closeBtn.onclick = () => closePackGallery();
  header.appendChild(closeBtn);

  // сортировка
  // ряд кнопок сортировки: клик по типу включает его, повторный клик — меняет направление
  const sortBar = document.createElement("div");
  sortBar.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;";
  const sortBtns = {};
  const setSort = (val) => {
    uiState.sorts[uiState.tab] = val;
    saveUiState();
    if (uiState.tab !== "saved") {
      setPage(1);
    }
    render();
  };
  for (const tabId of Object.keys(SORT_TYPES)) {
    sortBtns[tabId] = [];
    for (const [key, label, defDir] of SORT_TYPES[tabId]) {
      const b = document.createElement("button");
      b.dataset.key = key;
      b.dataset.def = defDir;
      b.textContent = label;
      b.style.cssText = "background:#1b1d22;border:1px solid #3a3d45;color:#ccc;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;";
      b.onclick = () => {
        const cur = currentSort();
        if (cur === key + "_desc") {
          setSort(key + "_asc");
        } else if (cur === key + "_asc") {
          setSort(key + "_desc");
        } else {
          setSort(key + "_" + defDir);
        }
      };
      sortBtns[tabId].push(b);
      sortBar.appendChild(b);
    }
  }
  const refreshSortBtns = () => {
    const cur = currentSort();
    const m = /^(.*)_(asc|desc)$/.exec(cur);
    const curKey = m ? m[1] : null;
    const curDir = m ? m[2] : null;
    for (const [tabId, btns] of Object.entries(sortBtns)) {
      for (const b of btns) {
        const on = tabId === uiState.tab && b.dataset.key === curKey;
        b.style.display = tabId === uiState.tab ? "" : "none";
        b.style.borderColor = on ? "#6af" : "#3a3d45";
        b.style.color = on ? "#fff" : "#ccc";
        b.textContent = b.dataset.key === curKey && on
          ? SORT_TYPES[tabId].find((s) => s[0] === b.dataset.key)[1] + (curDir === "desc" ? " ↓" : " ↑")
          : SORT_TYPES[tabId].find((s) => s[0] === b.dataset.key)[1];
      }
    }
  };

  // тоггл «скрыть скачанные»
  const hideLabel = document.createElement("label");
  hideLabel.style.cssText = "color:#aaa;font-size:13px;display:flex;align-items:center;gap:6px;";
  const hideChk = document.createElement("input");
  hideChk.type = "checkbox";
  hideChk.onchange = () => {
    uiState.hideDl[uiState.tab] = hideChk.checked;
    saveUiState();
    setPage(1);
    render();
  };
  hideLabel.appendChild(hideChk);
  hideLabel.appendChild(document.createTextNode("Hide downloaded"));

  // поисковая строка — во всех вкладках
  const searchWrap = document.createElement("label");
  searchWrap.style.cssText = "display:flex;align-items:center;gap:6px;margin-left:auto;";
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Search by name...";
  searchInput.style.cssText = inputCss + "min-width:200px;";
  searchInput.oninput = () => {
    uiState.query[uiState.tab] = searchInput.value;
    saveUiState();
    if (uiState.tab !== "saved") {
      setPage(1);
    }
    render();
  };
  searchWrap.appendChild(searchInput);
  controls.append(sortBar, hideLabel, searchWrap);

  const setTabs = () => {
    for (const [id, b] of Object.entries(tabs)) {
      b.style.cssText = tabCss;
      if (id === uiState.tab) {
        b.style.background = "#262a31";
        b.style.borderColor = "#5a5e68";
        b.style.color = "#fff";
        b.style.fontWeight = "bold";
      } else {
        b.style.background = "#1b1d22";
        b.style.borderColor = "#3a3d45";
        b.style.color = "#ccc";
        b.style.fontWeight = "normal";
      }
    }
    // набор сортировок под вкладку
    refreshSortBtns();
    searchInput.value = uiState.query[uiState.tab] || "";
    const isCatalog = uiState.tab !== "saved";
    hideLabel.style.display = isCatalog ? "flex" : "none";
    hideChk.checked = !!uiState.hideDl[uiState.tab];
  };

  // ---- рендер helpers (как в прежней версии) ----
  function clearBody() {
    body.innerHTML = "";
  }
  function grid() {
    const g = document.createElement("div");
    g.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,240px);justify-content:center;gap:14px;";
    return g;
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#111;border:1px solid #4a8;color:#ddd;padding:10px 18px;border-radius:8px;z-index:600;";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  // state: "current" (зелёная), "completed" (синяя — 100%), "failed" (красная).
  // metaAtBottom (каталог): всё, кроме названия, прижимается к низу карточки —
  // длинные названия не сдвигают мета-строки соседних блоков.
  function card(name, sub, author, state, onClick, cssExtra = "", statusText = "", rows = null, metaAtBottom = false) {
    const t = document.createElement("div");
    t.style.cssText = "background:#16181d;border:2px solid #3a3d45;border-radius:10px;padding:12px;cursor:pointer;display:flex;flex-direction:column;gap:6px;min-height:120px;" + cssExtra;
    if (state === "current") {
      t.style.borderColor = "#4a8";
    } else if (state === "completed") {
      t.style.borderColor = "#39c";
    } else if (state === "failed") {
      t.style.borderColor = "#a55";
    }
    const n = document.createElement("div");
    n.textContent = name;
    n.style.cssText = "font-weight:bold;font-size:15px;word-break:break-word;color:#eee;";
    t.appendChild(n);
    const metaHolder = metaAtBottom ? (() => {
      const d = document.createElement("div");
      d.style.cssText = "margin-top:auto;display:flex;flex-direction:column;gap:6px;";
      t.appendChild(d);
      return d;
    })() : t;
    if (sub) {
      const s = document.createElement("div");
      s.textContent = sub;
      s.style.cssText = "font-size:12px;color:#999;";
      metaHolder.appendChild(s);
    }
    if (author) {
      const a = document.createElement("div");
      a.textContent = author;
      a.style.cssText = "font-size:12px;color:#777;word-break:break-word;";
      metaHolder.appendChild(a);
    }
    if (statusText) {
      const st = document.createElement("div");
      st.textContent = statusText;
      st.style.cssText = "font-size:12px;color:#fc6;";
      metaHolder.appendChild(st);
    }
    if (rows) {
      const rowsEl = document.createElement("div");
      rowsEl.style.cssText = "margin-top:auto;display:flex;flex-direction:column;gap:4px;";
      (metaAtBottom ? metaHolder : t).appendChild(rowsEl);
      for (const row of rows) {
        const line = document.createElement("div");
        line.style.cssText = "display:flex;align-items:center;gap:6px;";
        const letter = document.createElement("span");
        letter.textContent = row.letter;
        letter.style.cssText = "font-size:11px;color:#bbb;width:14px;";
        const barWrap = document.createElement("div");
        barWrap.style.cssText = "flex:1;height:8px;background:#26282e;border-radius:3px;overflow:hidden;";
        const fill = document.createElement("div");
        const pct = row.total > 0 ? Math.round(row.done / row.total * 100) : 0;
        fill.style.cssText = "height:100%;width:" + pct + "%;background:#4a8;";
        barWrap.appendChild(fill);
        const cnt = document.createElement("span");
        cnt.textContent = row.total > 0 ? row.done + "/" + row.total : String(row.done);
        cnt.style.cssText = "font-size:11px;color:#bbb;width:52px;text-align:right;";
        line.append(letter, barWrap, cnt);
        rowsEl.appendChild(line);
      }
    }
    t.onclick = onClick;
    return t;
  }

  const progressOf = (meta) => {
    const done = countCompletedPerDifficulty(meta.id);
    const totals = Array.isArray(meta.levelsBreakdown) ? meta.levelsBreakdown : null;
    const rows = LETTERS.map((letter, i) => ({ letter, done: done[i], total: totals ? totals[i] : 0 }));
    const doneAll = totals !== null && rows.every((r) => r.total > 0 && r.done >= r.total);
    const played = done.reduce((s, n) => s + n, 0);
    const total = totals ? totals.reduce((s, n) => s + n, 0) : 0;
    return { rows, doneAll, pct: total > 0 ? played / total : 0 };
  };

  // Карточка сохранённого пака — используется и во вкладке Saved, и в каталоге
  // для уже скачанных паков (синяя рамка при 100%, кликабельна).
  // showSource — только вкладка Saved: источник строкой мета над автором
  const savedCard = (meta, currentId, metaAtBottom = false, showSource = false) => {
    const p = progressOf(meta);
    const state = currentId === meta.id ? "current" : p.doneAll ? "completed" : "";
    return card(meta.name, showSource ? (PACK_SOURCES[meta.source] || meta.source || "") : null,
      meta.author || (showSource ? "" : PACK_SOURCES[meta.source || "gdmod"]), state, async () => {
      await packMenu.onCachedPackSelected({ id: meta.id, name: meta.name, author: meta.author, levels: "", mrgSize: "", hasGdlvl: false });
      render();
    }, "", "", p.rows, metaAtBottom);
  };

  const mkBtn = (label, onClick, disabled) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = btnCss + (disabled ? "opacity:0.4;cursor:default;" : "");
    if (!disabled) {
      b.onclick = onClick;
    }
    return b;
  };

  // ---- каталог (gdmods / GDTR) ----
  async function renderCatalog() {
    clearBody();
    const source = TAB_SOURCES[uiState.tab];
    const g = grid();
    body.appendChild(g);
    const status = document.createElement("div");
    status.style.cssText = "text-align:center;color:#888;font-size:13px;";
    const pager = document.createElement("div");
    pager.style.cssText = "display:flex;gap:14px;align-items:center;justify-content:center;padding:14px;";
    body.appendChild(pager);
    status.textContent = "Loading...";
    let data;
    try {
      data = await pm.catalogPage(source, currentPage(), PAGE, { sort: currentSort(), hideDownloaded: hideChk.checked, query: uiState.query[uiState.tab] || "" });
    } catch (e) {
      console.error("PackGallery: catalog load failed:", e);
      status.textContent = "Failed to load local catalog (data/" + (source === "gdtr" ? "packs_gdtr" : "packs_gdmod") + ".*): " + (e && e.message ? e.message : e);
      pager.appendChild(status);
      return;
    }
    const { items, totalItems, totalPages, page } = data;
    setPage(page);
    const hiddenCount = hideChk.checked ? 0 : null;
    status.textContent = items.length === 0
      ? "No packs here yet."
      : `Page ${page}/${totalPages} — ${items.length} packs` + (totalItems !== items.length ? ` of ${totalItems}` : "");
    const currentId = menuManager.currentPackId;
    for (const it of items) {
      if (it.downloaded) {
        // скачанный пак в каталоге = карточка Saved (синяя рамка при 100%)
        const meta = it.cachedMeta
          ? { ...it.cachedMeta, source: it.source, levelsBreakdown: it.cachedMeta.levelsBreakdown || it.levelsBreakdown }
          : { id: it.id, name: it.name, author: it.author, source: it.source, levelsBreakdown: it.levelsBreakdown };
        g.appendChild(savedCard(meta, currentId, true));
        continue;
      }
      const borderState = currentId === it.id ? "current" : "";
      const subParts = [it.levels];
      if (it.downloads != null) {
        subParts.push(it.downloads + " dl");
      }
      if (it.addedRaw) {
        subParts.push(it.addedRaw);
      } else if (it.addedTs) {
        subParts.push(new Date(it.addedTs).toISOString().slice(0, 10));
      }
      const sub = subParts.filter(Boolean).join(" · ");
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
      }, "", busy ? "Downloading..." : "", null, true));
    }
    pager.append(
      mkBtn("◀ Prev", () => { if (page > 1) { setPage(page - 1); renderCatalog(); } }, page <= 1),
      status,
      mkBtn("Next ▶", () => { if (page < totalPages) { setPage(page + 1); renderCatalog(); } }, page >= totalPages)
    );
  }

  // ---- Saved ----
  async function renderSaved() {
    clearBody();
    const g = grid();
    body.appendChild(g);
    const currentId = menuManager.currentPackId;
    const sort = currentSort();
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
      saved = await pm.savedList();
    } catch {
    }
    const q = (uiState.query[uiState.tab] || "").trim().toLowerCase();
    if (q) {
      saved = saved.filter((m) => (m.name || "").toLowerCase().includes(q));
    }
    // сортировка saved: любой тип в обе стороны
    const m = /^(.*)_(asc|desc)$/.exec(sort) || ["", "saved", "desc"];
    const sKey = m[1];
    const sDir = m[2] === "asc" ? 1 : -1;
    const pcts = new Map(saved.map((x) => [x.id, progressOf(x).pct]));
    const cmpVal = (a, b) => {
      switch (sKey) {
        case "progress": return (pcts.get(a.id) ?? 0) - (pcts.get(b.id) ?? 0);
        case "saved": return (a.savedAt || 0) - (b.savedAt || 0);
        case "tracks": return (a.tracksTotal || 0) - (b.tracksTotal || 0);
        case "source": return ((a.source || "") + (a.name || "")).localeCompare((b.source || "") + (b.name || ""));
        case "author": return (a.author || "").localeCompare(b.author || "");
        default: return (a.name || "").localeCompare(b.name || "");
      }
    };
    saved.sort((a, b) => {
      const d = cmpVal(a, b);
      return (d !== 0 ? d : (a.name || "").localeCompare(b.name || "")) * sDir;
    });
    for (const meta of saved) {
      g.appendChild(savedCard(meta, currentId, false, true));
    }
    if (saved.length === 0) {
      const hint = document.createElement("div");
      hint.textContent = "No saved packs yet — download from the gdmods or GDTR tab.";
      hint.style.cssText = "grid-column:1/-1;text-align:center;color:#888;padding:20px;";
      g.appendChild(hint);
    }
  }

  const render = () => {
    refreshSortBtns();
    if (uiState.tab === "saved") {
      renderSaved();
    } else {
      renderCatalog();
    }
  };

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
  document.body.appendChild(overlay);
  setTabs();
  render();
}
