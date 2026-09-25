// Каталог скинов gdmod.ru: оконное кэширование (как у паков), парсинг таблицы скинов.
const GDMOD_SKINS_BASE = "https://gdmod.ru";
export class SkinCatalog {
  constructor(packManager) {
    this.pm = packManager;
    this.confirmedShortPages = new Set();
    this.windowItems = [];
    this.windowStart = 0;
    this.windowEnd = 0;
    this.catalogEnd = null;
  }
  static WINDOW_SIZE = 200;
  static ROW_RE = /<tr><td><a href='\/skins\/id\/(\d+)'>([^<]*)<\/a><\/td><td><img src='([^']+)'[^>]*><\/td><td><a href='\/skins\/author\/\d+'>([^<]*)<\/a>/g;
  parseSkinsHtml(html) {
    const items = [];
    SkinCatalog.ROW_RE.lastIndex = 0;
    let m;
    while ((m = SkinCatalog.ROW_RE.exec(html)) !== null) {
      items.push({
        id: parseInt(m[1], 10),
        name: m[2].trim(),
        thumbUrl: m[3].startsWith("http") ? m[3] : GDMOD_SKINS_BASE + m[3],
        author: m[4].trim()
      });
    }
    return items;
  }
    async fetchWindow(globalStart) {
    const size = SkinCatalog.WINDOW_SIZE;
    // нумерация страниц gdmod.ru НАЧИНАЕТСЯ С НУЛЯ: /skins/page/0/ — первая страница
    const serverPage = Math.floor(globalStart / size);
    const pageUrl = `${GDMOD_SKINS_BASE}/skins/page/${serverPage}/?onpage=${size}`;
    // gdmod иногда отдаёт усечённую страницу: 3 попытки, берём максимум
    let items = [];
    // уже подтверждённое короткое окно повторно не запрашиваем
    let maxAttempts = this.confirmedShortPages.has(serverPage) ? 1 : 3;
    for (let attempt = 0; attempt < maxAttempts; ++attempt) {
      if (attempt > 0) {
        await new Promise((res) => setTimeout(res, 600));
      }
      try {
        const resp = await this.pm.fetchWithProxy(pageUrl);
        const got = this.parseSkinsHtml(await this.pm.readResponseText(resp));
        if (got.length > items.length) {
          items = got;
        }
        if (items.length >= size) {
          break;
        }
        if (items.length > 0) {
          maxAttempts = Math.min(maxAttempts, 2);
          this.confirmedShortPages.add(serverPage);
        }
      } catch {
      }
    }
    this.windowItems = items;
    this.windowStart = serverPage * size;
    this.windowEnd = this.windowStart + items.length;
  }
  async getUiPage(uiPage, uiPerPage = 20) {
    const start = (uiPage - 1) * uiPerPage;
    const end = start + uiPerPage;
    if (start < this.windowStart || end > this.windowEnd) {
      await this.fetchWindow(start);
    }
    const from = start - this.windowStart;
    return this.windowItems.slice(from, from + uiPerPage);
  }
}
