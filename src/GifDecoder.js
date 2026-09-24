// Минимальный декодер GIF: кадры → canvas (RGBA), задержки, loop, disposal, transparency.
// Нужен, т.к. браузеры не анимируют GIF, отрисованный через drawImage в canvas.
export function isGifBlob(blob) {
  return blob.type === "image/gif" || blob.type === "application/octet-stream" || blob.type === "";
}
export async function decodeGif(blob) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (buf.length < 6 || buf[0] !== 0x47 || buf[1] !== 0x49 || buf[2] !== 0x46) {
    throw new Error("not a gif");
  }
  const dv = new DataView(buf.buffer);
  let pos = 6;
  const width = dv.getUint16(pos, true); pos += 2;
  const height = dv.getUint16(pos, true); pos += 2;
  const packed = buf[pos]; pos += 3;               // packed + bgIndex + aspect
  const gctFlag = (packed & 0x80) !== 0;
  const gctSize = 1 << ((packed & 7) + 1);
  let gct = null;
  if (gctFlag) {
    gct = readColorTable(buf, pos, gctSize); pos += 3 * gctSize;
  }
  const frames = [];
  let gce = { delay: 100, transparent: -1, disposal: 0 };
  let loop = 0;
  // полотно текущего состояния и «предыдущее» для disposal=3
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  const prevCanvas = document.createElement("canvas");
  prevCanvas.width = width; prevCanvas.height = height;
  const prevCtx = prevCanvas.getContext("2d");
  let bgColor = gctFlag ? gct[packed & 0x07 ? 0 : 0] : [0, 0, 0];
  // фон берём из logical screen descriptor (bg index)
  // (упрощённо: чёрный/первый цвет — не критично, т.к. подложка рисуется отдельно)
  void bgColor;
  while (pos < buf.length) {
    const block = buf[pos++];
    if (block === 0x3B) break;                     // trailer
    if (block === 0x21) {                          // extension
      const label = buf[pos++];
      if (label === 0xF9) {                        // Graphic Control
        pos++;                                     // size = 4
        const flags = buf[pos++];
        gce = {
          delay: dv.getUint16(pos, true) * 10,
          transparent: (flags & 1) !== 0 ? buf[pos + 2] : -1,
          disposal: (flags >> 2) & 7
        };
        pos += 3;                                  // delay(2) + transparent index(1)
        pos++;                                     // terminator
      } else if (label === 0xFF) {                 // Application (NETSCAPE loop)
        const size = buf[pos++];
        const app = String.fromCharCode(...buf.slice(pos, pos + 8)); pos += size;
        if (app.startsWith("NETSCAPE")) {
          pos++;                                   // sub-block size (3)
          if (buf[pos] === 1) loop = dv.getUint16(pos + 1, true);
          pos += 3;
        }
        while (buf[pos] !== 0) pos += buf[pos] + 1; // sub-blocks
        pos++;
      } else {
        while (buf[pos] !== 0) pos += buf[pos] + 1;
        pos++;
      }
    } else if (block === 0x2C) {                   // image descriptor
      const ix = dv.getUint16(pos, true), iy = dv.getUint16(pos + 2, true);
      const iw = dv.getUint16(pos + 4, true), ih = dv.getUint16(pos + 6, true);
      const ipacked = buf[pos + 8]; pos += 9;
      let lct = gct;
      if ((ipacked & 0x80) !== 0) {
        const size = 1 << ((ipacked & 7) + 1);
        lct = readColorTable(buf, pos, size); pos += 3 * size;
      }
      const interlaced = (ipacked & 0x40) !== 0;
      const minCodeSize = buf[pos++];
      const sub = readSubBlocks(buf, pos);
      const imageData = sub.data;
      pos = sub.pos;
      const pixels = lzwDecode(imageData, minCodeSize, iw * ih);
      // disposal ПЕРЕД рисованием нового кадра
      if (gce.disposal === 3) {
        prevCtx.clearRect(0, 0, width, height);
        prevCtx.drawImage(canvas, 0, 0);
      }
      drawFrame(ctx, pixels, lct, iw, ih, ix, iy, interlaced, gce.transparent, width);
      const frameCanvas = document.createElement("canvas");
      frameCanvas.width = width; frameCanvas.height = height;
      frameCanvas.getContext("2d").drawImage(canvas, 0, 0);
      frames.push({ canvas: frameCanvas, delay: Math.max(20, gce.delay) });
      if (gce.disposal === 2) {
        ctx.clearRect(ix, iy, iw, ih);
      } else if (gce.disposal === 3) {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(prevCanvas, 0, 0);
      }
      gce = { delay: 100, transparent: -1, disposal: 0 };
    } else {
      break;
    }
  }
  if (frames.length === 0) throw new Error("no frames");
  return { frames, loop };
}
function readColorTable(buf, pos, size) {
  const t = [];
  for (let i = 0; i < size; i++) {
    t.push([buf[pos + i * 3], buf[pos + i * 3 + 1], buf[pos + i * 3 + 2]]);
  }
  return t;
}
function readSubBlocks(buf, pos) {
  const out = [];
  while (buf[pos] !== 0) {
    for (let i = 0; i < buf[pos]; i++) out.push(buf[pos + 1 + i]);
    pos += buf[pos] + 1;
  }
  pos++;
  return { data: out, pos };
}
function lzwDecode(data, minCodeSize, expected) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  let codeSize = minCodeSize + 1;
  let dict = new Map();
  const resetDict = () => {
    dict = new Map();
    for (let i = 0; i < clearCode; i++) dict.set(i, [i]);
    dict.set(clearCode, []);
    dict.set(eoiCode, null);
  };
  resetDict();
  let nextCode = eoiCode + 1;
  let prev = null;
  const out = [];
  let bitPos = 0;
  const readCode = () => {
    let code = 0;
    for (let i = 0; i < codeSize; i++) {
      const byte = data[bitPos >> 3];
      if (byte === undefined) return -1;
      code |= ((byte >> (bitPos & 7)) & 1) << i;
      bitPos++;
    }
    return code;
  };
  while (out.length < expected) {
    const code = readCode();
    if (code === -1 || code === eoiCode) break;
    if (code === clearCode) {
      resetDict();
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prev = null;
      continue;
    }
    let entry;
    if (dict.has(code)) {
      entry = dict.get(code);
    } else if (code === nextCode && prev !== null) {
      entry = prev.concat(prev[0]);
    } else {
      break;
    }
    for (let i = 0; i < entry.length && out.length < expected; i++) out.push(entry[i]);
    if (prev !== null) {
      dict.set(nextCode, prev.concat(entry[0]));
      nextCode++;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++;
    }
    prev = entry;
  }
  return out;
}
function drawFrame(ctx, pixels, palette, iw, ih, ix, iy, interlaced, transparent, fullW) {
  const img = ctx.createImageData(iw, ih);
  const passStarts = interlaced ? [0, 4, 2, 1] : [0];
  const passSteps = interlaced ? [8, 8, 4, 2] : [1];
  let p = 0;
  for (let pass = 0; pass < passStarts.length; pass++) {
    for (let y = passStarts[pass]; y < ih; y += passSteps[pass]) {
      for (let x = 0; x < iw; x++) {
        const idx = pixels[p++];
        if (idx === transparent) continue;
        const c = palette[idx] || [0, 0, 0];
        const o = (y * iw + x) * 4;
        img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
    }
  }
  void fullW;
  const tmp = document.createElement("canvas");
  tmp.width = iw; tmp.height = ih;
  tmp.getContext("2d").putImageData(img, 0, 0);
  ctx.drawImage(tmp, ix, iy);
}
