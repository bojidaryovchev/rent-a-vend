#!/usr/bin/env node
/**
 * Brand assets, generated from one file.
 *
 * Everything a browser, a phone home screen and a share card need is derived
 * from `public/logo-icon-only.png`. Run it after the logo changes:
 *
 *   npm run brand:assets
 *
 * Why a script rather than files someone exported from a design tool once: the
 * favicon, the touch icon and the maskable icon are the same mark at five
 * sizes with three different amounts of padding, and hand-cut sets drift. When
 * one of them is a year out of date it is always the one nobody looks at.
 *
 * No dependencies. PNG is deflate plus four filter types, ICO is a header and
 * some bitmaps, and pulling in an image library for that would be a heavier
 * commitment than the 200 lines it takes to do directly.
 *
 * WHY THE MARK SITS ON A PLATE. The artwork is dark ink with white panels on a
 * transparent ground. Left transparent it is invisible against dark browser
 * chrome - which is most browser chrome now - and iOS composites transparency
 * onto black, which loses the machine bodies entirely. So every icon is the
 * mark on a paper square: the same "stamped plate" the rest of the site is
 * built from, and it reads on any background because it brings its own.
 */

import { deflateSync, inflateSync } from "node:zlib";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = process.cwd();
const SOURCE = join(ROOT, "public/logo-icon-only.png");

/* Straight from src/app/globals.css, converted out of oklch. The icons must be
   the same paper as the page behind them, not a near-white that reads as grubby
   next to it. */
const PAPER = [250, 249, 247];

/* -- PNG ------------------------------------------------------------------ */

function decodePng(file) {
  const buf = readFileSync(file);
  const idat = [];
  let pos = 8;
  let width, height, depth, colorType;

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    }
    pos += 12 + len;
  }

  if (depth !== 8) throw new Error(`${file}: bit depth ${depth}, expected 8`);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`${file}: colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  let p = 0;

  /* Undo the per-scanline filters. Paeth is the only fiddly one. */
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride);
    p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const guess = a + b - c;
        const da = Math.abs(guess - a);
        const db = Math.abs(guess - b);
        const dc = Math.abs(guess - c);
        v += da <= db && da <= dc ? a : db <= dc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  /* Normalise everything to RGBA so the rest of the script has one case. */
  if (channels === 4) return { width, height, data: out };
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0, j = 0; i < width * height; i++, j += channels) {
    const grey = channels <= 2;
    rgba[i * 4] = grey ? out[j] : out[j];
    rgba[i * 4 + 1] = grey ? out[j] : out[j + 1];
    rgba[i * 4 + 2] = grey ? out[j] : out[j + 2];
    rgba[i * 4 + 3] = channels === 2 ? out[j + 1] : channels === 4 ? out[j + 3] : 255;
  }
  return { width, height, data: rgba };
}

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter 0; these are flat graphics, not photos
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -- pixels --------------------------------------------------------------- */

/**
 * Area-average downscale, alpha premultiplied.
 *
 * Premultiplying matters: averaging the colour of a transparent pixel in with
 * its neighbours drags a dark halo around every edge, which at 16px is most of
 * the icon.
 */
function resize(img, size) {
  const { width: sw, height: sh, data } = img;
  const out = Buffer.alloc(size * size * 4);
  const sx = sw / size;
  const sy = sh / size;

  for (let y = 0; y < size; y++) {
    const y0 = Math.floor(y * sy);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < size; x++) {
      const x0 = Math.floor(x * sx);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;

      for (let py = y0; py < Math.min(y1, sh); py++) {
        for (let px = x0; px < Math.min(x1, sw); px++) {
          const i = (py * sw + px) * 4;
          const al = data[i + 3] / 255;
          r += data[i] * al;
          g += data[i + 1] * al;
          b += data[i + 2] * al;
          a += al;
          n++;
        }
      }

      const d = (y * size + x) * 4;
      const alpha = a / n;
      out[d] = alpha > 0 ? Math.round(r / n / alpha) : 0;
      out[d + 1] = alpha > 0 ? Math.round(g / n / alpha) : 0;
      out[d + 2] = alpha > 0 ? Math.round(b / n / alpha) : 0;
      out[d + 3] = Math.round(alpha * 255);
    }
  }
  return { width: size, height: size, data: out };
}

/**
 * The mark for dark grounds.
 *
 * Neutrals are flipped end for end - ink 34 becomes paper 248, the white
 * panels become graphite 38 - while anything with chroma in it passes straight
 * through, so the accent yellow stays the accent yellow. A plain invert would
 * have turned it blue.
 */
function invertNeutrals(img) {
  const out = Buffer.from(img.data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i], g = out[i + 1], b = out[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const keep = Math.min(1, Math.max(0, (chroma - 20) / 40));
    const lum = (r + g + b) / 3;
    const v = Math.min(255, Math.max(0, 248 - 0.9502 * (lum - 34)));
    out[i] = Math.round(v * (1 - keep) + r * keep);
    out[i + 1] = Math.round(v * 0.995 * (1 - keep) + g * keep);
    out[i + 2] = Math.round(v * 0.978 * (1 - keep) + b * keep);
  }
  return { ...img, data: out };
}

/** The mark centred on an opaque square, filling `fill` of the width. */
function plate(mark, size, fill, background) {
  const inner = Math.round(size * fill);
  const scaled = resize(mark, inner);
  const offset = Math.round((size - inner) / 2);
  const out = Buffer.alloc(size * size * 4);

  for (let i = 0; i < size * size; i++) {
    out[i * 4] = background[0];
    out[i * 4 + 1] = background[1];
    out[i * 4 + 2] = background[2];
    out[i * 4 + 3] = 255;
  }

  for (let y = 0; y < inner; y++) {
    for (let x = 0; x < inner; x++) {
      const s = (y * inner + x) * 4;
      const alpha = scaled.data[s + 3] / 255;
      if (alpha === 0) continue;
      const d = ((y + offset) * size + (x + offset)) * 4;
      for (let c = 0; c < 3; c++) {
        out[d + c] = Math.round(scaled.data[s + c] * alpha + out[d + c] * (1 - alpha));
      }
    }
  }
  return { width: size, height: size, data: out };
}

/* -- ICO ------------------------------------------------------------------ */

/**
 * A multi-size .ico, in BMP rather than PNG entries.
 *
 * PNG-in-ICO is smaller and every browser released this decade reads it, but
 * .ico is the format that exists precisely for the things that are not modern
 * browsers - the Windows taskbar, a pinned tile, whatever an intranet is
 * running. BMP entries cost a few KB and never surprise anyone.
 */
function encodeIco(images) {
  const entries = [];
  const bodies = [];

  for (const img of images) {
    const { width: w, height: h, data } = img;
    const header = Buffer.alloc(40);
    header.writeUInt32LE(40, 0);
    header.writeInt32LE(w, 4);
    header.writeInt32LE(h * 2, 8); // XOR bitmap plus the AND mask below it
    header.writeUInt16LE(1, 12);
    header.writeUInt16LE(32, 14);
    header.writeUInt32LE(w * h * 4, 20);

    /* Bottom-up BGRA, the way BMP has always wanted it. */
    const pixels = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = ((h - 1 - y) * w + x) * 4;
        const d = (y * w + x) * 4;
        pixels[d] = data[s + 2];
        pixels[d + 1] = data[s + 1];
        pixels[d + 2] = data[s];
        pixels[d + 3] = data[s + 3];
      }
    }

    /* Every pixel is opaque, so the 1bpp mask is all zeros - but it has to be
       there, padded to four-byte rows, or the icon renders as garbage. */
    const maskStride = Math.ceil(w / 32) * 4;
    const mask = Buffer.alloc(maskStride * h);

    bodies.push(Buffer.concat([header, pixels, mask]));
    entries.push({ w, h });
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const directory = Buffer.alloc(16 * images.length);
  let offset = 6 + directory.length;

  images.forEach((img, i) => {
    const at = i * 16;
    directory[at] = img.width === 256 ? 0 : img.width;
    directory[at + 1] = img.height === 256 ? 0 : img.height;
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(bodies[i].length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += bodies[i].length;
  });

  return Buffer.concat([header, directory, ...bodies]);
}

/* -- what gets written ---------------------------------------------------- */

function write(path, buffer, note) {
  const full = join(ROOT, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, buffer);
  console.log(
    `  ${path.padEnd(38)} ${String((buffer.length / 1024).toFixed(1) + "KB").padStart(8)}  ${note}`,
  );
}

const mark = decodePng(SOURCE);
console.log(`\nОт public/logo-icon-only.png (${mark.width}x${mark.height})\n`);

const light = invertNeutrals(mark);

/* The light mark, for the footer and anything else on steel. Generated here so
   it cannot fall out of step with the dark one it is derived from. */
write(
  "public/logo-icon-only-light.png",
  encodePng(light),
  "знакът за тъмен фон",
);

/* Browsers. Sizes climb because a 16px icon needs proportionally less padding
   than a 512px one - at 16px the padding IS the icon. */
write(
  "src/app/favicon.ico",
  encodeIco([
    plate(mark, 16, 0.92, PAPER),
    plate(mark, 32, 0.88, PAPER),
    plate(mark, 48, 0.86, PAPER),
  ]),
  "16/32/48, за таба и таскбара",
);

write("src/app/icon.png", encodePng(plate(mark, 192, 0.8, PAPER)), "PNG икона");

/* iOS ignores transparency and applies its own rounded mask, so this one fills
   the square and keeps well clear of the corners. */
write(
  "src/app/apple-icon.png",
  encodePng(plate(mark, 180, 0.74, PAPER)),
  "начален екран на iPhone",
);

/* The manifest cannot point at Next's hashed /icon route, so its icons live in
   public/ under stable names. */
write("public/icon-192.png", encodePng(plate(mark, 192, 0.8, PAPER)), "манифест");
write("public/icon-512.png", encodePng(plate(mark, 512, 0.8, PAPER)), "манифест");

/* Android crops maskable icons to whatever shape the launcher likes. The
   guaranteed area is the middle 80% circle, which a square only fits inside at
   about 56% of the width. Anything bigger loses corners on some phones. */
write(
  "public/icon-maskable-512.png",
  encodePng(plate(mark, 512, 0.56, PAPER)),
  "Android, с поле за изрязване",
);

/* For the share card. Small on purpose: next/og inlines it into a 500KB
   budget shared with the two fonts. */
write(
  "assets/og-mark.png",
  encodePng(resize(light, 256)),
  "за opengraph-image",
);

console.log("\nГотово.\n");
