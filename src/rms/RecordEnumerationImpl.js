class RecordEnumerationImpl {
  currentPos = 0;
  data;
  constructor(data = []) {
    this.data = data;
  }
  numRecords() {
    return this.data.length;
  }
  nextRecord() {
    return this.data[this.currentPos++];
  }
  addRecord(bytes) {
    this.data.push(bytes);
    return this.data.length - 1;
  }
  setRecord(index, bytes) {
    if (this.data.length <= index) {
      throw new Error("RecordStoreException");
    }
    this.data[index] = bytes;
  }
  reset() {
    this.currentPos = 0;
  }
  nextRecordId() {
    if (this.currentPos >= this.data.length) {
      throw new Error("RecordStoreException");
    }
    return this.currentPos;
  }
  destroy() {
  }
}
export {
  RecordEnumerationImpl
};
