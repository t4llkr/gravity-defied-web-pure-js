// Каталог скинов из локального data/skins.json (399 записей, окна любого размера).
import { LocalArchive } from "./LocalArchive.js";
import { formatBytes, normalizeDate } from "./PackManager.js";

const SORTS = {
  date_desc: (a, b) => (b.addedTs ?? -1) - (a.addedTs ?? -1),
  date_asc: (a, b) => (a.addedTs ?? Infinity) - (b.addedTs ?? Infinity),
  downloads_desc: (a, b) => (b.downloads ?? -1) - (a.downloads ?? -1),
  downloads_asc: (a, b) => (a.downloads ?? -1) - (b.downloads ?? -1),
  name_desc: (a, b) => (b.name || "").localeCompare(a.name || ""),
  name_asc: (a, b) => (a.name || "").localeCompare(b.name || ""),
  author_desc: (a, b) => (b.author || "").localeCompare(a.author || ""),
  author_asc: (a, b) => (a.author || "").localeCompare(b.author || ""),
};

export class SkinCatalog {
  constructor() {
    this.archive = LocalArchive.skins();
    this._items = null;
    this.totalItems = 0;
    this.lastSliceRawCount = 0;
  }

  async _load() {
    if (!this._items) {
      const data = await this.archive.json();
      const items = data.items.map((it) => ({
        id: Number(it.id),
        name: it.name ?? "Skin " + it.id,
        author: it.author ?? "",
        authorId: it.authorId ?? null,
        addedRaw: it.added ?? null,
        addedTs: normalizeDate(it.added),
        downloads: it.downloads ?? null,
        zipBytes: it.zipSize ?? null,
        zipSize: formatBytes(it.zipSize),
      }));
      items.sort(SORTS.date_desc);
      this._items = items;
      this.totalItems = items.length;
    }
    return this._items;
  }

  sortList(sort, query = "") {
    const cmp = SORTS[sort] || SORTS.date_desc;
    const q = query.trim().toLowerCase();
    const all = this._items.slice().sort(cmp);
    return q ? all.filter((it) => (it.name || "").toLowerCase().includes(q)) : all;
  }

  // Совместимость со SkinGallery: возвращает страницу массивом
  async getUiPage(uiPage, uiPerPage, sort = "date_desc", query = "") {
    await this._load();
    const all = this.sortList(sort, query);
    const items = all.slice((uiPage - 1) * uiPerPage, uiPage * uiPerPage);
    this.lastSliceRawCount = items.length;
    this.lastTotal = all.length;
    return items;
  }
}
