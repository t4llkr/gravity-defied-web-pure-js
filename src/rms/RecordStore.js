import { RecordEnumerationImpl } from "./RecordEnumerationImpl.js";
function toStorageKey(name) {
  return `gravity_defied_record_store:${name}`;
}
class RecordStore {
  static opened = /* @__PURE__ */ new Map();
  name;
  records;
  constructor(name, records) {
    this.name = name;
    this.records = records;
  }
  static setRecordStoreDir(_progName) {
  }
  static openRecordStore(name, createIfNecessary) {
    const existing = RecordStore.opened.get(name);
    if (existing !== void 0) {
      return existing;
    }
    const item = window.localStorage.getItem(toStorageKey(name));
    if (item === null) {
      if (!createIfNecessary) {
        throw new Error("RecordStoreException");
      }
      const created = new RecordStore(name, new RecordEnumerationImpl());
      created.save();
      RecordStore.opened.set(name, created);
      return created;
    }
    const parsed = JSON.parse(item);
    const records = new RecordEnumerationImpl(parsed.map((entry) => Int8Array.from(entry)));
    const store = new RecordStore(name, records);
    RecordStore.opened.set(name, store);
    return store;
  }
  closeRecordStore() {
  }
  static deleteRecordStore(name) {
    window.localStorage.removeItem(toStorageKey(name));
    RecordStore.opened.delete(name);
  }
  static listRecordStores() {
    const result = [];
    for (let i = 0; i < window.localStorage.length; ++i) {
      const key = window.localStorage.key(i);
      if (key !== null && key.startsWith("gravity_defied_record_store:")) {
        result.push(key.substring("gravity_defied_record_store:".length));
      }
    }
    return result;
  }
  enumerateRecords(_filter, _comparator, _keepUpdated) {
    return this.records;
  }
  addRecord(arr, offset, numBytes) {
    if (offset !== 0) {
      throw new Error("RecordStoreException");
    }
    const bytes = Int8Array.from(Array.from(arr).slice(0, numBytes));
    const id = this.records.addRecord(bytes);
    this.save();
    return id;
  }
  setRecord(recordId, arr, offset, numBytes) {
    void offset;
    const bytes = Int8Array.from(Array.from(arr).slice(0, numBytes));
    this.records.setRecord(recordId, bytes);
    this.save();
  }
  save() {
    const payload = JSON.stringify(this.records.data.map((entry) => Array.from(entry)));
    window.localStorage.setItem(toStorageKey(this.name), payload);
  }
}
export {
  RecordStore
};
