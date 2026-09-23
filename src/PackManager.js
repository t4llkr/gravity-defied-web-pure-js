import { MRGCache } from "./MRGCache.js";
const GDMOD_BASE = "https://gdmod.ru";
const CLOUDFLARE_PROXY = "https://lively-dream-dcdb.myorgbot.workers.dev/?url=";
const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
const CORS_PROXIES = [
  ...(IS_LOCAL ? ["/proxy/"] : []),
  // локальный прокси из server.py при разработке; в проде — только воркер
  CLOUDFLARE_PROXY,
  "https://api.allorigins.win/raw?url=",
  // raw-ответ, без ключей, без жёстких лимитов
  "https://api.codetabs.com/v1/proxy?quest=",
  // raw-ответ, простой и стабильный
  "https://cors.isomorphic-git.org/",
  // прокси от проекта isomorphic-git, префикс + сырой URL
  "https://corsproxy.io/?url=",
  // был 401 — оставлен на случай восстановления
  "https://api.cors.lol/?url=",
  // был 429 — оставлен на случай восстановления
  "https://proxy.corsfix.com/?"
  // был 502 — оставлен на случай восстановления
];
class PackManager {
  cache;
  currentProxy;
  constructor(proxyUrl) {
    this.cache = new MRGCache();
    this.customProxy = proxyUrl ?? null;
    this.currentProxy = this.customProxy ?? CORS_PROXIES[0];
  }
  async init() {
    await this.cache.open();
  }
  setProxy(url) {
    this.customProxy = url ?? null;
    this.currentProxy = url ?? CORS_PROXIES[0];
  }
  getProxy() {
    return this.currentProxy;
  }
  async fetchWithProxy(url) {
    // явно заданный прокси — только он
    if (this.customProxy !== null) {
      return this.tryFetch(this.customProxy + url, this.customProxy, url);
    }
    // сначала пробуем напрямую (вдруг у сайта появились CORS-заголовки)
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        this.currentProxy = "";
        return resp;
      }
    } catch {
      // CORS-блок или сеть — идём через прокси
    }
    const errors = ["direct → CORS/сеть"];
    for (const proxy of CORS_PROXIES) {
      // часть прокси ждёт URL закодированным, часть — сырым; пробуем оба варианта
      const variants = [...new Set([proxy + encodeURIComponent(url), proxy + url])];
      for (const proxyUrl of variants) {
        try {
          const resp = await fetch(proxyUrl);
          if (resp.ok) {
            this.currentProxy = proxy;
            return resp;
          }
          errors.push(`${proxy.split("//")[1]?.split("/")[0] ?? proxy} → HTTP ${resp.status}`);
        } catch (e) {
          errors.push(`${proxy.split("//")[1]?.split("/")[0] ?? proxy} → ${e.name}`);
        }
      }
    }
    throw new Error(`Все CORS-прокси недоступны: ${errors.join("; ")}`);
  }
  async tryFetch(proxyUrl, proxy, targetUrl) {
    const resp = await fetch(proxyUrl);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    this.currentProxy = proxy;
    return resp;
  }
  async fetchPackList(page = 1, perPage = 50) {
    const url = `${GDMOD_BASE}/tracks/?onpage=${perPage}&page=${page}`;
    const resp = await this.fetchWithProxy(url);
    const html = await resp.text();
    return this.parsePackListHtml(html);
  }
  parsePackListHtml(html) {
    const tracks = [];
    const rowRegex = /<tr[^>]*>(.*?)<\/tr>/gs;
    const rows = html.match(rowRegex) ?? [];
    for (const row of rows) {
      if (!row.includes("/tracks/id/")) continue;
      const idMatch = row.match(/href='\/tracks\/id\/(\d+)'>(.*?)<\/a>/);
      const levelsMatch = row.match(/href='\/tracks\/id\/\d+\/\?do=list'>(.*?)<\/a>/);
      const authorMatch = row.match(/href='\/tracks\/author\/(\d+)'>(.*?)<\/a>/);
      const mrgSizeMatch = row.match(/MRG\s*<\/a>\s*<span class='size'>(.*?)<\/span>/);
      const gdlvlMatch = row.match(/href='(\/\?get=gdlvl&id=\d+)'/);
      const gdlvlSizeMatch = row.match(/GDLVL\s*<\/a>\s*<span class='size'>(.*?)<\/span>/);
      if (idMatch && levelsMatch && authorMatch) {
        tracks.push({
          id: parseInt(idMatch[1], 10),
          name: this.unescapeHtml(idMatch[2].trim()),
          author: this.unescapeHtml(authorMatch[2].trim()),
          authorId: parseInt(authorMatch[1], 10),
          levels: levelsMatch[1].trim(),
          mrgSize: mrgSizeMatch?.[1]?.trim() ?? "",
          gdlvlSize: gdlvlSizeMatch?.[1]?.trim(),
          hasGdlvl: !!gdlvlMatch
        });
      }
    }
    return tracks;
  }
  async fetchPackDetail(id) {
    const url = `${GDMOD_BASE}/tracks/id/${id}`;
    const resp = await this.fetchWithProxy(url);
    const html = await resp.text();
    return this.parsePackDetailHtml(html, id);
  }
  parsePackDetailHtml(html, id) {
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const authorMatch = html.match(/Автор:<\/b>\s*<a[^>]*>(.*?)<\/a>/);
    const authorIdMatch = html.match(/Автор:<\/b>\s*<a href='\/tracks\/author\/(\d+)'/);
    const levelsMatch = html.match(/Уровни:<\/b>\s*<a[^>]*>(.*?)<\/a>/);
    const originalityMatch = html.match(/Оригинальность:<\/b>\s*<b><span[^>]*>(.*?)<\/span>/);
    const dateMatch = html.match(/Добавлен:<\/b>\s*([^<]+)/);
    const downloadsMatch = html.match(/Скачиваний:\s*(\d+)/);
    const mrgSizeMatch = html.match(/MRG\s*<\/a>\s*<span class="size">(.*?)<\/span>/);
    return {
      id,
      name: this.unescapeHtml(titleMatch?.[1]?.split("|")[0]?.trim() ?? "Unknown"),
      author: this.unescapeHtml(authorMatch?.[1]?.trim() ?? ""),
      authorId: parseInt(authorIdMatch?.[1] ?? "0", 10),
      levels: levelsMatch?.[1]?.trim() ?? "",
      originality: originalityMatch?.[1]?.trim() ?? "",
      date: dateMatch?.[1]?.trim() ?? "",
      downloads: downloadsMatch ? parseInt(downloadsMatch[1], 10) : void 0,
      mrgSize: mrgSizeMatch?.[1]?.trim() ?? "",
      hasGdlvl: html.includes("get=gdlvl"),
      downloadedAt: 0
    };
  }
  async downloadPack(id) {
    const cached = await this.cache.getPack(id);
    if (cached) {
      return { buffer: cached.mrgBuffer, metadata: cached.metadata };
    }
    const url = `${GDMOD_BASE}/?get=levels.mrg&id=${id}`;
    const resp = await this.fetchWithProxy(url);
    const buffer = await resp.arrayBuffer();
    let metadata = (await this.cache.getAllMetadata()).find((m) => m.id === id);
    if (!metadata) {
      const detail = await this.fetchPackDetail(id);
      metadata = { ...detail, downloadedAt: Date.now() };
    }
    await this.cache.savePack(id, buffer, metadata);
    return { buffer, metadata };
  }
  async getPackBlobUrl(id) {
    const cachedUrl = await this.cache.getPackBlobUrl(id);
    if (cachedUrl) return cachedUrl;
    const { buffer } = await this.downloadPack(id);
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    return URL.createObjectURL(blob);
  }
  async getCachedPacks() {
    return this.cache.getAllMetadata();
  }
  async isPackCached(id) {
    return this.cache.hasPack(id);
  }
  async deletePack(id) {
    return this.cache.deletePack(id);
  }
  async clearCache() {
    return this.cache.clearAll();
  }
  getCacheSize() {
    return this.cache.getCacheSize();
  }
  unescapeHtml(text) {
    const map = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#039;": "'",
      "&mdash;": "\u2014",
      "&ndash;": "\u2013"
    };
    return text.replace(/&(?:amp|lt|gt|quot|#039|mdash|ndash);/g, (m) => map[m] ?? m);
  }
}
export {
  PackManager
};
