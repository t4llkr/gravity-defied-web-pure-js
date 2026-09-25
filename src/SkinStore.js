// Хранилище скинов: IndexedDB "gdvisual" v2 (стор "skins").
// ВАЖНО: версия БД поднята до 2 — при апгрейде создаём ТОЛЬКО отсутствующие сторы.
const DB_NAME = "gdvisual";
const DB_VERSION = 2;
const STORE = "skins";
function openDb() {
  return new Promise((resolve, reject) => {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    rq.onupgradeneeded = () => {
      const db = rq.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv");
      }
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    rq.onsuccess = () => resolve(rq.result);
    rq.onerror = () => reject(rq.error);
  });
}
async function run(mode, op) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = op(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request ? request.result : undefined);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export function saveSkin(record) {
  return run("readwrite", (s) => s.put(record));
}
export function getSkin(id) {
  return run("readonly", (s) => s.get(id));
}
export function getAllSkins() {
  return run("readonly", (s) => s.getAll());
}
export function removeSkin(id) {
  return run("readwrite", (s) => s.delete(id));
}
