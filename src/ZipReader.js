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

// ==================== Random-access ZIP (локальные архивы data/*.zip) ====================
// openZip(arrayBuffer): парсит central directory, распаковка по требованию —
// извлекаем отдельные файлы из ~10-20 МБ архива без полной распаковки.
export async function openZip(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  const eocd = openZipFindEocd(view, bytes.length);
  const count = view.getUint16(eocd + 10, true);
  let pos = view.getUint32(eocd + 16, true);
  const entries = new Map();
  const decoder = new TextDecoder();
  for (let i = 0; i < count; i++) {
    if (view.getUint32(pos, true) !== 0x02014b50) {
      throw new Error("openZip: broken central directory");
    }
    const method = view.getUint16(pos + 10, true);
    const compSize = view.getUint32(pos + 20, true);
    const size = view.getUint32(pos + 24, true);
    const nameLen = view.getUint16(pos + 28, true);
    const extraLen = view.getUint16(pos + 30, true);
    const commentLen = view.getUint16(pos + 32, true);
    const lho = view.getUint32(pos + 42, true);
    const name = decoder.decode(bytes.subarray(pos + 46, pos + 46 + nameLen));
    entries.set(name, { method, compSize, size, lho });
    pos += 46 + nameLen + extraLen + commentLen;
  }
  async function extract(name) {
    const e = entries.get(name);
    if (!e) {
      throw new Error("openZip: entry not found: " + name);
    }
    if (view.getUint32(e.lho, true) !== 0x04034b50) {
      throw new Error("openZip: broken local header for " + name);
    }
    const nameLen = view.getUint16(e.lho + 26, true);
    const extraLen = view.getUint16(e.lho + 28, true);
    const start = e.lho + 30 + nameLen + extraLen;
    const raw = bytes.subarray(start, start + e.compSize);
    if (e.method === 0) {
      return raw.slice();
    }
    if (e.method !== 8) {
      throw new Error("openZip: unsupported method " + e.method);
    }
    const ds = new DecompressionStream("deflate-raw");
    const buf = await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer();
    const out = new Uint8Array(buf);
    if (e.size && out.length !== e.size) {
      console.warn("openZip: size mismatch", name, out.length, e.size);
    }
    return out;
  }
  return { names: [...entries.keys()], entries, extract };
}

function openZipFindEocd(view, len) {
  const min = Math.max(0, len - 65557);
  for (let p = len - 22; p >= min; p--) {
    if (view.getUint32(p, true) === 0x06054b50) {
      return p;
    }
  }
  throw new Error("openZip: EOCD not found");
}
