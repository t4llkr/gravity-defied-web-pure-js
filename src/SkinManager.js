// Управление скинами: скачивание ZIP с gdmod.ru, распаковка, применение,
// хранение в IndexedDB, восстановление при старте, сброс на дефолт.
import { unzip } from "./ZipReader.js";
import { Image as LcduiImage } from "./lcdui/Image.js";
import { saveSkin, getSkin, getAllSkins } from "./SkinStore.js";

const SKIN_PARTS = ["helmet", "sprites", "bluearm", "blueleg", "bluebody", "engine", "fender"];
const LAST_SKIN_KEY = "gd-last-skin";

// URL встроенных ассетов — для сброса на дефолтный скин
function builtinAssetUrl(name) {
  return new URL(`./assets/${name}.png`, import.meta.url).href;
}

export class SkinManager {
  constructor(packManager, gameCanvas) {
    this.packManager = packManager;
    this.gameCanvas = gameCanvas;
    this.currentId = "default";
  }
  async imagesFromZipBlob(zipBlob) {
    const files = await unzip(zipBlob);
    const images = {};
    for (const part of SKIN_PARTS) {
      const data = files.get(part + ".png") ?? files.get(part + ".gif") ?? null;
      if (data === null) {
        throw new Error("skin missing part: " + part);
      }
      const url = URL.createObjectURL(new Blob([data], { type: "image/png" }));
      images[part] = await this.loadImage(url);
      URL.revokeObjectURL(url);
    }
    return images;
  }
  loadImage(url) {
    return LcduiImage.load(url);
  }
  applyImages(images) {
    const caches = this.gameCanvas.assetCaches;
    for (const part of SKIN_PARTS) {
      caches[part + "Image"] = images[part];
    }
    this.gameCanvas.rebindSpriteImages();
  }
  // скачать скин с gdmod.ru, сохранить в кэш и применить
  async downloadAndApply(item) {
    const resp = await this.packManager.fetchWithProxy(`https://gdmod.ru/?get=skins.zip&id=${item.id}`);
    const zipBlob = await resp.blob();
    const images = await this.imagesFromZipBlob(zipBlob);
    // миниатюру храним как URL: <img> показывает её с gdmod.ru без CORS,
    // а fetch-байты были бы заблокированы (fetch не освобождается от CORS)
    await saveSkin({ id: item.id, name: item.name, author: item.author, zipBlob, thumbUrl: item.thumbUrl, savedAt: Date.now() });
    this.applyImages(images);
    this.setCurrent(item.id);
    return true;
  }
  async applySaved(id) {
    if (typeof id === "string" && /^\d+$/.test(id)) {
      id = parseInt(id, 10);
    }
    if (id === "default") {
      return this.applyDefault();
    }
    const rec = await getSkin(id);
    if (!rec) {
      return this.applyDefault();
    }
    const images = await this.imagesFromZipBlob(rec.zipBlob);
    this.applyImages(images);
    this.setCurrent(id);
    return true;
  }
  async applyDefault() {
    const images = {};
    for (const part of SKIN_PARTS) {
      images[part] = await this.loadImage(builtinAssetUrl(part));
    }
    this.applyImages(images);
    this.setCurrent("default");
    return true;
  }
  setCurrent(id) {
    this.currentId = id;
    try {
      window.localStorage.setItem(LAST_SKIN_KEY, String(id));
    } catch {
    }
  }
  async restoreOnBoot() {
    let id = "default";
    try {
      id = window.localStorage.getItem(LAST_SKIN_KEY) || "default";
    } catch {
    }
    try {
      await this.applySaved(id);
    } catch (e) {
      console.error("[skins] restore failed:", e && e.stack || e);
      await this.applyDefault();
    }
  }
  async savedSkins() {
    try {
      return await getAllSkins();
    } catch {
      return [];
    }
  }
}
