// raster — shared helpers for export-icons.mjs and render-templates.mjs. Zero dependencies (node:zlib only).
// PNG decode/encode (8-bit RGB/RGBA, non-interlaced — what Chromium screenshots produce), alpha flattening,
// ICO packing (PNG-compressed entries) and the Playwright loader.

import { deflateSync, inflateSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function pngSize(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(SIGNATURE)) throw new Error('Not a PNG file');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// -> { width, height, channels (3|4), data: Buffer of width*height*channels }
export function decodePng(buf) {
  const { width, height } = pngSize(buf);
  let off = 8;
  let colorType, bitDepth, interlace;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { bitDepth = body[8]; colorType = body[9]; interlace = body[12]; }
    else if (type === 'IDAT') idat.push(body);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bitDepth !== 8 || ![2, 6].includes(colorType) || interlace !== 0) {
    throw new Error(`Unsupported PNG (bit depth ${bitDepth}, colour type ${colorType}, interlace ${interlace}); expected 8-bit RGB/RGBA non-interlaced`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const data = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? data[y * stride + x - channels] : 0;
      const b = y > 0 ? data[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? data[(y - 1) * stride + x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error(`Bad PNG filter ${filter} on row ${y}`);
      data[y * stride + x] = v & 0xff;
    }
  }
  return { width, height, channels, data };
}

function chunk(type, body) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(body.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
  return Buffer.concat([head, body, crc]);
}

export function encodePng({ width, height, channels, data }) {
  if (![3, 4].includes(channels)) throw new Error('channels must be 3 (RGB) or 4 (RGBA)');
  if (data.length !== width * height * channels) throw new Error('pixel buffer size does not match width × height × channels');
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : 2;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([SIGNATURE, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

export function parseHex(hex) {
  const m = String(hex).trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) throw new Error(`Invalid colour "${hex}" (expected #RGB or #RRGGBB)`);
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

// Composites RGBA over an opaque background and returns an RGB PNG (no alpha channel).
export function flattenPng(buf, bgHex = '#FFFFFF') {
  const img = decodePng(buf);
  if (img.channels === 3) return encodePng(img);
  const [br, bg, bb] = parseHex(bgHex);
  const out = Buffer.alloc(img.width * img.height * 3);
  for (let i = 0, j = 0; i < img.data.length; i += 4, j += 3) {
    const a = img.data[i + 3] / 255;
    out[j] = Math.round(img.data[i] * a + br * (1 - a));
    out[j + 1] = Math.round(img.data[i + 1] * a + bg * (1 - a));
    out[j + 2] = Math.round(img.data[i + 2] * a + bb * (1 - a));
  }
  return encodePng({ width: img.width, height: img.height, channels: 3, data: out });
}

// ICO with PNG-compressed entries (supported by all current browsers and Windows Vista+).
export function buildIco(pngs) {
  if (!pngs.length) throw new Error('buildIco needs at least one PNG');
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const png of pngs) {
    const { width, height } = pngSize(png);
    if (width > 256 || height > 256) throw new Error(`ICO entries must be ≤ 256 px (got ${width}×${height})`);
    const e = Buffer.alloc(16);
    e[0] = width === 256 ? 0 : width;
    e[1] = height === 256 ? 0 : height;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...pngs]);
}

export const PLAYWRIGHT_HELP = 'Install it in the project (npm i -D playwright && npx playwright install chromium) or set PLAYWRIGHT_DIR to a folder whose node_modules has playwright. Without Playwright: open the HTML in the browser tool and take element screenshots at the listed sizes.';

// Resolves Playwright from $PLAYWRIGHT_DIR, else from the current directory. Returns chromium or null.
export function loadChromium(env = process.env) {
  const base = resolve(env.PLAYWRIGHT_DIR || process.cwd());
  try {
    return createRequire(join(base, 'package.json'))('playwright').chromium;
  } catch {
    return null;
  }
}
