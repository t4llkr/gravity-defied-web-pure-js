// Галерея скинов: DOM-оверлей с вкладками "Catalog" (gdmod.ru) и "Saved" (IndexedDB).
// Миниатюры каталога грузятся НАПРЯМЮ с gdmod.ru (<img> не требует CORS).
let activeGallery = null;

export function closeSkinGallery() {
  if (activeGallery !== null) {
    activeGallery();
    activeGallery = null;
  }
}

export function openSkinGallery(skinManager, catalog) {
  closeSkinGallery();
  const overlay = document.createElement("div");
  overlay.style.cssText = "position:fixed;inset:0;z-index:900;background:rgba(10,10,14,0.96);display:flex;flex-direction:column;font-family:sans-serif;color:#ddd;";

  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;gap:16px;padding:12px 20px;border-bottom:1px solid #333;";
  const title = document.createElement("span");
  title.textContent = "Skins";
  title.style.cssText = "font-size:20px;font-weight:bold;";
  const tabCatalog = mkTab("Catalog", true);
  const tabSaved = mkTab("Saved", false);
  const spacer = document.createElement("span");
  spacer.style.flex = "1";
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = btnCss();
  closeBtn.onclick = () => closeSkinGallery();
  header.append(title, tabCatalog.el, tabSaved.el, spacer, closeBtn);

  const body = document.createElement("div");
  body.style.cssText = "flex:1;overflow-y:auto;padding:16px 20px;";
  overlay.append(header, body);
  document.body.appendChild(overlay);

  let tab = "catalog";
  let catalogPage = 1;
  const CATALOG_PAGE_SIZE = 50;
  let lastCatalogCount = -1;
  let busyId = null;

  function mkTab(label, active) {
    const el = document.createElement("button");
    el.textContent = label;
    el.style.cssText = btnCss() + (active ? "background:#3a6ea5;color:#fff;" : "");
    return { el };
  }
  function btnCss() {
    return "padding:6px 14px;border:1px solid #555;background:#222;color:#ccc;cursor:pointer;border-radius:4px;font-size:14px;";
  }
  function setTabs() {
    tabCatalog.el.style.cssText = btnCss() + (tab === "catalog" ? "background:#3a6ea5;color:#fff;" : "");
    tabSaved.el.style.cssText = btnCss() + (tab === "saved" ? "background:#3a6ea5;color:#fff;" : "");
  }
  function grid() {
    const g = document.createElement("div");
    g.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:14px;";
    return g;
  }
  function tile(imgSrc, name, author, isCurrent, onClick, badge, extra) {
    const t = document.createElement("div");
    t.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px;border:1px solid " + (isCurrent ? "#5a5" : "#444") + ";border-radius:6px;cursor:pointer;background:#181820;";
    const img = document.createElement("img");
    img.src = imgSrc;
    img.style.cssText = "width:84px;height:84px;object-fit:contain;image-rendering:pixelated;background:#fff;border-radius:4px;";
    img.loading = "lazy";
    const n = document.createElement("div");
    n.textContent = (badge ? badge + " " : "") + name;
    n.style.cssText = "font-size:13px;text-align:center;word-break:break-word;";
    if (extra) {
      const e = document.createElement("div");
      e.textContent = extra;
      e.style.cssText = "font-size:11px;color:#fc6;";
      t.appendChild(e);
    }
    const a = document.createElement("div");
    a.textContent = author || "";
    a.style.cssText = "font-size:11px;color:#888;text-align:center;";
    t.append(img, n, a);
    t.onclick = onClick;
    return t;
  }
  function clearBody() {
    body.innerHTML = "";
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:absolute;top:14px;left:50%;transform:translateX(-50%);background:#274; color:#dfe;border:1px solid #4a6;padding:8px 18px;border-radius:6px;font-size:14px;z-index:5;";
    overlay.appendChild(t);
    setTimeout(() => t.remove(), 3200);
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

    let savedIds = new Set();
    try {
      savedIds = new Set((await skinManager.savedSkins()).map((r) => r.id));
    } catch {
    }
    status.textContent = "Loading...";
    let items = [];
    try {
      items = await catalog.getUiPage(catalogPage, CATALOG_PAGE_SIZE);
    } catch {
      items = [];
    }
    lastCatalogCount = items.length;
    // сохранённые скины скрываем из каталога (они живут во вкладке Saved)
    const visibleItems = items.filter((it) => !savedIds.has(it.id));
    const hidden = items.length - visibleItems.length;
    status.textContent = items.length === 0 && catalogPage === 1
      ? "Failed to load catalog (check connection / proxy)"
      : `Page ${catalogPage} — ${visibleItems.length} skins` + (hidden > 0 ? ` (${hidden} saved, see Saved tab)` : "");
    for (const it of visibleItems) {
      const isCurrent = skinManager.currentId === it.id;
      const badge = "";
      const t = tile(it.thumbUrl, it.name, it.author, isCurrent, async () => {
        if (busyId !== null) {
          return;
        }
        busyId = it.id;
        renderCatalog();
        let ok = false;
        try {
          await skinManager.downloadAndApply(it);
          ok = true;
        } catch {
        }
        busyId = null;
        renderCatalog();
        if (ok) {
          toast("Saved! Find it in the Saved tab");
        }
      }, badge, busyId === it.id ? "Downloading..." : "");
      g.appendChild(t);
    }
    const mkBtn = (label, onClick, disabled) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = btnCss() + (disabled ? "opacity:0.4;cursor:default;" : "");
      if (!disabled) {
        b.onclick = onClick;
      }
      return b;
    };
    pager.append(
      mkBtn("◀ Prev", () => { if (catalogPage > 1) { catalogPage--; renderCatalog(); } }, catalogPage <= 1),
      status,
      mkBtn("Next ▶", () => {
        if (lastCatalogCount === CATALOG_PAGE_SIZE) {
          catalogPage++;
          renderCatalog();
        }
      }, lastCatalogCount < CATALOG_PAGE_SIZE)
    );
  }

  async function renderSaved() {
    clearBody();
    const g = grid();
    body.appendChild(g);
    // дефолтный скин — первой плиткой
    g.appendChild(tile(new URL("./assets/helmet.png", import.meta.url).href, "Default", "built-in", skinManager.currentId === "default", async () => {
      await applyWithFeedback("default", () => skinManager.applyDefault());
    }, ""));
    const saved = await skinManager.savedSkins();
    saved.sort((a, b) => a.name.localeCompare(b.name));
    for (const rec of saved) {
      const src = rec.thumbUrl || (rec.thumbBlob ? URL.createObjectURL(rec.thumbBlob) : "");
      const t = tile(src, rec.name, rec.author || "gdmod.ru", skinManager.currentId === rec.id, async () => {
        await applyWithFeedback(rec.id, () => skinManager.applySaved(rec.id));
        if (rec.thumbBlob) {
          setTimeout(() => URL.revokeObjectURL(src), 5000);
        }
      }, "");
      g.appendChild(t);
    }
    if (saved.length === 0) {
      const hint = document.createElement("div");
      hint.textContent = "No saved skins yet — download from the Catalog tab.";
      hint.style.cssText = "grid-column:1/-1;text-align:center;color:#888;padding:20px;";
      g.appendChild(hint);
    }
  }

  async function applyWithFeedback(id, op) {
    try {
      await op();
    } catch {
      /* оставляем прежний скин */
    }
    // перерисовать маркеры CURRENT
    if (tab === "catalog") {
      renderCatalog();
    } else {
      renderSaved();
    }
  }

  tabCatalog.el.onclick = () => { tab = "catalog"; setTabs(); renderCatalog(); };
  tabSaved.el.onclick = () => { tab = "saved"; setTabs(); renderSaved(); };

  const onKey = (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      closeSkinGallery();
    }
  };
  window.addEventListener("keydown", onKey, true);

  const cleanup = () => {
    window.removeEventListener("keydown", onKey, true);
    overlay.remove();
  };
  activeGallery = cleanup;

  setTabs();
  renderCatalog();
}
