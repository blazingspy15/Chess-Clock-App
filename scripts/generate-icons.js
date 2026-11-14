const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table & function for pure Node.js PNG creation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function createPNG(width, height, getPixelRGBA) {
  // 1. PNG Header
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // 2. IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = Buffer.alloc(4 + 4 + 13 + 4);
  ihdrChunk.writeUInt32BE(13, 0);
  ihdrChunk.write('IHDR', 4);
  ihdrData.copy(ihdrChunk, 8);
  ihdrChunk.writeUInt32BE(crc32(ihdrChunk.subarray(4, 21)), 21);

  // 3. Image Raw Scanlines (1 filter byte 0x00 per row + 4 bytes per pixel)
  const rowStride = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowStride);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = getPixelRGBA(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = Buffer.alloc(4 + 4 + compressed.length + 4);
  idatChunk.writeUInt32BE(compressed.length, 0);
  idatChunk.write('IDAT', 4);
  compressed.copy(idatChunk, 8);
  idatChunk.writeUInt32BE(crc32(idatChunk.subarray(4, 8 + compressed.length)), 8 + compressed.length);

  // 4. IEND Chunk
  const iendChunk = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

  return Buffer.concat([header, ihdrChunk, idatChunk, iendChunk]);
}

// Distance helper
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

// Draw the Icon: Dark Graphite Background + Dual Digital Clock Bezels + Elegant Chess Knight
function renderChessClockIcon(x, y, width, height) {
  const nx = (x / width) * 2 - 1; // -1 to +1
  const ny = (y / height) * 2 - 1; // -1 to +1

  // Background: Deep Graphite with very subtle radial vignette
  const rBg = dist(nx, ny, 0, 0);
  let bgR = 12;
  let bgG = 14;
  let bgB = 18;

  // Outer Squircle / Rounded Frame (radius ~ 0.85)
  const squircle = Math.pow(Math.abs(nx), 3.5) + Math.pow(Math.abs(ny), 3.5);
  if (squircle > 0.85) {
    // Outside boundary for standalone icon
    return [bgR, bgG, bgB, 255];
  }

  // Inner Dual Clock Arches: Left (Green/Active), Right (Subtle/Muted)
  // Left Clock Half: nx in [-0.75, -0.05], ny in [-0.7, 0.7]
  const isLeftClock = nx >= -0.72 && nx <= -0.08 && Math.abs(ny) <= 0.68;
  const isRightClock = nx >= 0.08 && nx <= 0.72 && Math.abs(ny) <= 0.68;

  // Center Central Dead-Zone divider: nx in [-0.08, 0.08]
  const isDivider = Math.abs(nx) < 0.05 && Math.abs(ny) <= 0.68;

  // Let's create an iconic Chess Knight Silhouette in the center
  // Scale center: (0, 0.05)
  const kx = nx;
  const ky = ny + 0.02;

  // Knight head & snout:
  const isKnightMuzzle = kx >= -0.32 && kx <= -0.02 && ky >= -0.22 && ky <= -0.02;
  const isKnightEars = kx >= -0.08 && kx <= 0.14 && ky >= -0.42 && ky <= -0.22;
  const isKnightMane = kx >= 0.02 && kx <= 0.28 && ky >= -0.32 && ky <= 0.28;
  const isKnightChest = kx >= -0.26 && kx <= 0.12 && ky >= -0.08 && ky <= 0.32;
  const isKnightBase = Math.abs(kx) <= 0.38 && ky >= 0.28 && ky <= 0.44;

  const isKnight =
    (isKnightMuzzle && (kx - ky < 0.1)) ||
    (isKnightEars && (kx + ky < 0.05)) ||
    (isKnightMane && (kx * 0.8 + ky < 0.35)) ||
    isKnightChest ||
    isKnightBase;

  // Digital Timer Display Bar above base:
  const isTimerBarLeft = nx >= -0.62 && nx <= -0.18 && ny >= -0.58 && ny <= -0.46;
  const isTimerBarRight = nx >= 0.18 && nx <= 0.62 && ny >= -0.58 && ny <= -0.46;

  // Coloring:
  if (isKnight) {
    // Chess Knight in Crisp Bright Emerald & White
    if (kx < -0.02) {
      // Emerald Green highlight
      return [16, 185, 129, 255]; // #10b981
    } else {
      // Pure clean white
      return [248, 250, 252, 255]; // #f8fafc
    }
  }

  // Active Green Clock Digital Bars
  if (isTimerBarLeft) {
    return [16, 185, 129, 255]; // Vibrant green active
  }
  if (isTimerBarRight) {
    return [51, 65, 85, 255]; // Slate inactive
  }

  // Dual Clock Panels
  if (isLeftClock) {
    // Left active plate: dark emerald slate tint
    return [20, 36, 32, 255];
  }

  if (isRightClock) {
    // Right plate: dark graphite slate
    return [24, 28, 38, 255];
  }

  if (isDivider) {
    return [12, 14, 18, 255];
  }

  return [bgR, bgG, bgB, 255];
}

// Generate the 4 assets
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

console.log('Generating high-res App Icon (1024x1024)...');
const iconBuf = createPNG(1024, 1024, renderChessClockIcon);
fs.writeFileSync(path.join(assetsDir, 'icon.png'), iconBuf);

console.log('Generating Adaptive Icon (1024x1024)...');
const adaptiveBuf = createPNG(1024, 1024, renderChessClockIcon);
fs.writeFileSync(path.join(assetsDir, 'adaptive-icon.png'), adaptiveBuf);

console.log('Generating Splash Icon (1024x1024)...');
const splashBuf = createPNG(1024, 1024, renderChessClockIcon);
fs.writeFileSync(path.join(assetsDir, 'splash-icon.png'), splashBuf);

console.log('Generating Web Favicon (48x48)...');
const faviconBuf = createPNG(48, 48, renderChessClockIcon);
fs.writeFileSync(path.join(assetsDir, 'favicon.png'), faviconBuf);

console.log('✓ All 4 icons generated successfully in assets/!');
