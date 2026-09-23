class FileStream {
  view;
  bytes;
  pos = 0;
  constructor(buffer) {
    this.view = new DataView(buffer);
    this.bytes = new Uint8Array(buffer);
  }
  static async fromUrl(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error(`Loaded empty resource from ${url}`);
    }
    return new FileStream(buffer);
  }
  isOpen() {
    return true;
  }
  setPos(pos) {
    this.pos = pos;
  }
  getPos() {
    return this.pos;
  }
  readInt8() {
    const value = this.view.getInt8(this.pos);
    this.pos += 1;
    return value;
  }
  readInt16(swapEndianness = false) {
    this.assertCanRead(2);
    const value = this.view.getInt16(this.pos, !swapEndianness);
    this.pos += 2;
    return value;
  }
  readInt32(swapEndianness = false) {
    this.assertCanRead(4);
    const value = this.view.getInt32(this.pos, !swapEndianness);
    this.pos += 4;
    return value;
  }
  readBytes(length) {
    this.assertCanRead(length);
    const value = this.bytes.slice(this.pos, this.pos + length);
    this.pos += length;
    return value;
  }
  assertCanRead(length) {
    if (this.pos + length > this.view.byteLength) {
      throw new Error(`Unexpected end of stream at ${this.pos}, wanted ${length} more bytes, size=${this.view.byteLength}`);
    }
  }
}
export {
  FileStream
};
