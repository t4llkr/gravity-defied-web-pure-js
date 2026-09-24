import { RecordStore } from "./rms/RecordStore.js";
class RecordManager {
  static LEAGUES_MAX = 4;
  static RECORD_NO_MAX = 3;
  static PLAYER_NAME_MAX = 3;
  static unused = 3;
  recordTimeMs = Array.from({ length: 4 }, () => Array(3).fill(0));
  recordName = Array.from(
    { length: RecordManager.LEAGUES_MAX },
    () => Array.from({ length: RecordManager.RECORD_NO_MAX }, () => new Uint8Array(RecordManager.PLAYER_NAME_MAX + 1))
  );
  recordStore = null;
  packedRecordInfoRecordId = -1;
  packedRecordInfo = new Int8Array(96);
  packPrefix = "";
  str = "";
  openRecordStoreForTrack(var1, var2) {
    this.resetRecordsTime();
    this.str = `${this.packPrefix}${var1}${var2}`;
    this.recordStore = RecordStore.openRecordStore(this.str, true);
    this.packedRecordInfoRecordId = -1;
    const recordEnum = this.recordStore.enumerateRecords(null, null, false);
    if (recordEnum.numRecords() > 0) {
      const var4 = recordEnum.nextRecord();
      recordEnum.reset();
      this.packedRecordInfoRecordId = recordEnum.nextRecordId();
      this.loadRecordInfo(var4);
      recordEnum.destroy();
    }
  }
  load5BytesAsLong(var1, offset) {
    let result = 0;
    let mult = 1;
    for (let var7 = offset; var7 < 5 + offset; ++var7) {
      const var8 = (var1[var7] + 256) % 256;
      result += mult * var8;
      mult *= 256;
    }
    return result;
  }
  pushLongAs5Bytes(var1, var2, var3) {
    for (let var5 = var2; var5 < 5 + var2; ++var5) {
      var1[var5] = var3 % 256;
      var3 = Math.trunc(var3 / 256);
    }
  }
  loadRecordInfo(var1) {
    let offset = 0;
    for (let league = 0; league < 4; ++league) {
      for (let pos = 0; pos < 3; ++pos) {
        this.recordTimeMs[league][pos] = this.load5BytesAsLong(var1, offset);
        offset += 5;
      }
    }
    for (let league = 0; league < RecordManager.LEAGUES_MAX; ++league) {
      for (let pos = 0; pos < RecordManager.RECORD_NO_MAX; ++pos) {
        for (let i = 0; i < RecordManager.PLAYER_NAME_MAX; ++i) {
          this.recordName[league][pos][i] = var1[offset++];
        }
      }
    }
  }
  getLevelInfo(var1) {
    let shift = 0;
    for (let league = 0; league < 4; ++league) {
      for (let recordNo = 0; recordNo < 3; ++recordNo) {
        this.pushLongAs5Bytes(var1, shift, this.recordTimeMs[league][recordNo]);
        shift += 5;
      }
    }
    for (let league = 0; league < RecordManager.LEAGUES_MAX; ++league) {
      for (let recordNo = 0; recordNo < RecordManager.RECORD_NO_MAX; ++recordNo) {
        for (let i = 0; i < RecordManager.PLAYER_NAME_MAX; ++i) {
          var1[shift++] = this.recordName[league][recordNo][i];
        }
      }
    }
  }
  resetRecordsTime() {
    for (let league = 0; league < 4; ++league) {
      for (let pos = 0; pos < 3; ++pos) {
        this.recordTimeMs[league][pos] = 0;
      }
    }
  }
  getRecordDescription(var1) {
    const var2 = new Array(3).fill("");
    for (let var3 = 0; var3 < 3; ++var3) {
      if (this.recordTimeMs[var1][var3] !== 0) {
        const var4 = Math.trunc(this.recordTimeMs[var1][var3] / 100);
        const var5 = this.recordTimeMs[var1][var3] % 100;
        const name = String.fromCharCode(...Array.from(this.recordName[var1][var3].slice(0, 3))).replace(/\0/g, "");
        var2[var3] = `${name} `;
        if (Math.trunc(var4 / 60) < 10) {
          var2[var3] += ` 0${Math.trunc(var4 / 60)}`;
        } else {
          var2[var3] += ` ${Math.trunc(var4 / 60)}`;
        }
        if (var4 % 60 < 10) {
          var2[var3] += `:0${var4 % 60}`;
        } else {
          var2[var3] += `:${var4 % 60}`;
        }
        if (var5 < 10) {
          var2[var3] += `.0${var5}`;
        } else {
          var2[var3] += `.${var5}`;
        }
      } else {
        var2[var3] = "";
      }
    }
    return var2;
  }
  writeRecordInfo() {
    this.getLevelInfo(this.packedRecordInfo);
    if (this.recordStore === null) {
      return;
    }
    if (this.packedRecordInfoRecordId === -1) {
      this.packedRecordInfoRecordId = this.recordStore.addRecord(this.packedRecordInfo, 0, 96);
    } else {
      this.recordStore.setRecord(this.packedRecordInfoRecordId, this.packedRecordInfo, 0, 96);
    }
  }
  getPosOfNewRecord(league, timeMs) {
    for (let i = 0; i < 3; ++i) {
      if (this.recordTimeMs[league][i] > timeMs || this.recordTimeMs[league][i] === 0) {
        return i;
      }
    }
    return 3;
  }
  addRecordIfNeeded(league, values, timeMs) {
    const newRecordPos = this.getPosOfNewRecord(league, timeMs);
    if (newRecordPos !== 3) {
      if (timeMs > 16777e3) {
        timeMs = 16777e3;
      }
      this.addNewRecord(league, newRecordPos);
      this.recordTimeMs[league][newRecordPos] = timeMs;
      for (let i = 0; i < RecordManager.PLAYER_NAME_MAX; ++i) {
        this.recordName[league][newRecordPos][i] = values[i];
      }
    }
  }
  addNewRecord(gameLevel, position) {
    for (let pos = 2; pos > position; --pos) {
      this.recordTimeMs[gameLevel][pos] = this.recordTimeMs[gameLevel][pos - 1];
      for (let i = 0; i < RecordManager.PLAYER_NAME_MAX; ++i) {
        this.recordName[gameLevel][pos][i] = this.recordName[gameLevel][pos - 1][i];
      }
    }
  }
  deleteRecordStoresForCurrentPack() {
    const prefix = this.packPrefix;
    const names = RecordStore.listRecordStores();
    for (const name of names) {
      if (name === "GWTRStates") {
        continue;
      }
      if (prefix === "") {
        if (/^[0-9]{2}$/.test(name)) {
          RecordStore.deleteRecordStore(name);
        }
      } else if (name.startsWith(prefix)) {
        RecordStore.deleteRecordStore(name);
      }
    }
  }
  deleteRecordStores() {
    const names = RecordStore.listRecordStores();
    for (const name of names) {
      if (name !== "GWTRStates") {
        RecordStore.deleteRecordStore(name);
      }
    }
  }
  closeRecordStore() {
    this.recordStore?.closeRecordStore();
  }
}
export {
  RecordManager
};
