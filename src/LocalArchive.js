// Локальный архив данных: <base>.json (метаданные каталога) + <base>.zip (файлы)
// рядом с приложением в data/. Имена архивов совпадают с именами JSON.
// Паки: файл внутри zip начинается с "<id>_". Скины: имя файла == id.
import { openZip } from "./ZipReader.js";

const DATA_DIR = new URL("../data/", import.meta.url).href;

export class LocalArchive {
  // byPrefix: true — искать файл по префиксу "<id>_" (паки);
  //           false — точное совпадение "<id>[.zip]" (скины)
  // byPrefix: true — паки, файл начинается с "<id>_";
  //           false — точное имя "<id>[.zip]" (скины);
  //           "ext" — "<id>.<любое расширение>" (skins_thumbs — одиночные картинки)
  constructor(baseName, { byPrefix = true } = {}) {
    this.baseName = baseName;
    this.byPrefix = byPrefix;
    this._jsonPromise = null;
    this._zipPromise = null;
  }
  static packs(source) {
    return new LocalArchive(source === "gdtr" ? "packs_gdtr" : "packs_gdmod", { byPrefix: true });
  }
  static skins() {
    return new LocalArchive("skins", { byPrefix: false });
  }
  static thumbs() {
    return new LocalArchive("skins_thumbs", { byPrefix: "ext" });
  }

  json() {
    if (!this._jsonPromise) {
      this._jsonPromise = fetch(DATA_DIR + this.baseName + ".json").then(async (r) => {
        if (!r.ok) {
          throw new Error(this.baseName + ".json: HTTP " + r.status);
        }
        const data = await r.json();
        if (!data || !Array.isArray(data.items)) {
          throw new Error(this.baseName + ".json: bad schema");
        }
        return data;
      });
    }
    return this._jsonPromise;
  }

  // onProgress(loadedBytes) — опциональный прогресс скачивания zip
  zip(onProgress) {
    if (!this._zipPromise) {
      this._zipPromise = (async () => {
        const r = await fetch(DATA_DIR + this.baseName + ".zip");
        if (!r.ok) {
          throw new Error(this.baseName + ".zip: HTTP " + r.status);
        }
        const buf = await readAll(r, onProgress);
        const z = await openZip(buf);
        const byId = new Map();
        for (const name of z.names) {
          const base = name.slice(name.lastIndexOf("/") + 1);
          if (this.byPrefix === "ext") {
            const m = /^(\d+)\.[A-Za-z0-9]+$/.exec(base);
            if (m) {
              byId.set(m[1], name);
            }
          } else if (this.byPrefix) {
            const m = /^(\d+)_/.exec(base);
            if (m && !byId.has(m[1])) {
              byId.set(m[1], name);
            }
          } else {
            const m = /^(\d+)(?:\.zip)?$/i.exec(base);
            if (m) {
              byId.set(m[1], name);
            }
          }
        }
        return { zip: z, byId };
      })();
    }
    return this._zipPromise;
  }

  async extractById(id, onProgress) {
    const { zip, byId } = await this.zip(onProgress);
    const name = byId.get(String(id));
    if (!name) {
      throw new Error(this.baseName + ": file not found for id " + id);
    }
    const bytes = await zip.extract(name);
    return new Blob([bytes]);
  }

  async hasId(id) {
    const { byId } = await this.zip();
    return byId.has(String(id));
  }
}

async function readAll(resp, onProgress) {
  if (!resp.body || !onProgress) {
    return resp.arrayBuffer();
  }
  const reader = resp.body.getReader();
  const chunks = [];
  let loaded = 0;
  for (;;) {
    const step = await reader.read();
    if (step.done) {
      break;
    }
    chunks.push(step.value);
    loaded += step.value.length;
    onProgress(loaded);
  }
  const out = new Uint8Array(loaded);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out.buffer;
}
