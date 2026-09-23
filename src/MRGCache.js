const DB_NAME = "GravityDefiedPacks";
const DB_VERSION = 1;
const STORE_PACKS = "packs";
const STORE_METADATA = "metadata";
class MRGCache {
  db = null;
  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_PACKS)) {
          db.createObjectStore(STORE_PACKS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_METADATA)) {
          const metaStore = db.createObjectStore(STORE_METADATA, { keyPath: "id" });
          metaStore.createIndex("author", "author", { unique: false });
          metaStore.createIndex("name", "name", { unique: false });
        }
      };
    });
  }
  async savePack(id, mrgBuffer, metadata) {
    if (!this.db) await this.open();
    const pack = {
      id,
      mrgBuffer,
      metadata: { ...metadata, downloadedAt: Date.now() },
      cachedAt: Date.now()
    };
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_PACKS, STORE_METADATA], "readwrite");
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore(STORE_PACKS).put(pack);
      tx.objectStore(STORE_METADATA).put(pack.metadata);
    });
  }
  async getPack(id) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_PACKS, "readonly");
      const request = tx.objectStore(STORE_PACKS).get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  }
  async getPackBlobUrl(id) {
    const pack = await this.getPack(id);
    if (!pack) return null;
    const blob = new Blob([pack.mrgBuffer], { type: "application/octet-stream" });
    return URL.createObjectURL(blob);
  }
  async updatePackMeta(id, patch) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_METADATA, "readwrite");
      const request = tx.objectStore(STORE_METADATA).get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const existing = request.result;
        if (!existing) {
          resolve(false);
          return;
        }
        tx.objectStore(STORE_METADATA).put({ ...existing, ...patch });
        resolve(true);
      };
    });
  }
  async getAllMetadata() {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_METADATA, "readonly");
      const request = tx.objectStore(STORE_METADATA).getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? []);
    });
  }
  async hasPack(id) {
    const pack = await this.getPack(id);
    return pack !== null;
  }
  async deletePack(id) {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_PACKS, STORE_METADATA], "readwrite");
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore(STORE_PACKS).delete(id);
      tx.objectStore(STORE_METADATA).delete(id);
    });
  }
  async clearAll() {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_PACKS, STORE_METADATA], "readwrite");
      tx.onerror = () => reject(tx.error);
      tx.oncomplete = () => resolve();
      tx.objectStore(STORE_PACKS).clear();
      tx.objectStore(STORE_METADATA).clear();
    });
  }
  async getCacheSize() {
    const all = await this.getAllMetadata();
    return all.length;
  }
}
export {
  MRGCache
};
