// Минимальный ZIP-ридер: центральная директория + inflate через встроенный
// DecompressionStream("deflate-raw") — без внешних зависимостей.
export async function unzip(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; --i) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new Error("not a zip (EOCD not found)");
  }
  const count = dv.getUint16(eocd + 10, true);
  let cd = dv.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  const files = new Map();
  for (let n = 0; n < count; ++n) {
    if (dv.getUint32(cd, true) !== 0x02014b50) {
      break;
    }
    const method = dv.getUint16(cd + 10, true);
    const compSize = dv.getUint32(cd + 20, true);
    const nameLen = dv.getUint16(cd + 28, true);
    const extraLen = dv.getUint16(cd + 30, true);
    const commentLen = dv.getUint16(cd + 32, true);
    const localOff = dv.getUint32(cd + 42, true);
    const name = decoder.decode(buf.subarray(cd + 46, cd + 46 + nameLen));
    cd += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) {
      continue;
    }
    if (compSize === 0xFFFFFFFF) {
      throw new Error("zip64 not supported");
    }
    const lNameLen = dv.getUint16(localOff + 26, true);
    const lExtraLen = dv.getUint16(localOff + 28, true);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const data = buf.subarray(dataStart, dataStart + compSize);
    let out;
    if (method === 0) {
      out = data;
    } else if (method === 8) {
      out = await inflateRaw(data);
    } else {
      throw new Error("unsupported zip method " + method);
    }
    files.set(name, out);
  }
  return files;
}
async function inflateRaw(data) {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([data]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
