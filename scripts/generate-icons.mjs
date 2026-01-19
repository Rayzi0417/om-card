// 生成 PWA 图标的脚本
// 运行: node scripts/generate-icons.mjs

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

// CRC32 计算
function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = getCRC32Table();
  
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
  }
  
  return crc ^ 0xFFFFFFFF;
}

let crc32Table = null;
function getCRC32Table() {
  if (crc32Table) return crc32Table;
  
  crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crc32Table[i] = c;
  }
  return crc32Table;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc >>> 0);
  
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createIHDRChunk(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data.writeUInt8(8, 8);  // bit depth
  data.writeUInt8(2, 9);  // color type (RGB)
  data.writeUInt8(0, 10); // compression
  data.writeUInt8(0, 11); // filter
  data.writeUInt8(0, 12); // interlace
  
  return createChunk('IHDR', data);
}

function createIDATChunk(width, height, isMaskable) {
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = width * 0.42;
  const innerRadius = width * 0.32;
  const ringRadius = width * 0.38;
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    rawData[rowStart] = 0;
    
    for (let x = 0; x < width; x++) {
      const pixelStart = rowStart + 1 + x * 3;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 默认背景色 #0f0f23
      let r = 15, g = 15, b = 35;
      
      // Maskable 需要更多 safe zone
      const safeRadius = isMaskable ? width * 0.36 : width * 0.45;
      
      if (distance < safeRadius) {
        // 外圈光环
        if (distance > innerRadius && distance < outerRadius) {
          const ringDist = Math.abs(distance - ringRadius);
          if (ringDist < 6) {
            const alpha = 1 - ringDist / 6;
            r = Math.floor(15 + (201 - 15) * alpha * 0.8);
            g = Math.floor(15 + (169 - 15) * alpha * 0.8);
            b = Math.floor(35 + (89 - 35) * alpha * 0.8);
          }
        }
        
        // 内圆区域
        if (distance < innerRadius) {
          // 渐变背景
          const t = distance / innerRadius;
          r = Math.floor(26 - t * 8);
          g = Math.floor(26 - t * 8);
          b = Math.floor(46 - t * 8);
          
          // 中心金色点 (代表 Om)
          if (distance < width * 0.06) {
            const centerAlpha = 1 - distance / (width * 0.06);
            r = Math.floor(r + (201 - r) * centerAlpha);
            g = Math.floor(g + (169 - g) * centerAlpha);
            b = Math.floor(b + (89 - b) * centerAlpha);
          }
        }
      }
      
      rawData[pixelStart] = r;
      rawData[pixelStart + 1] = g;
      rawData[pixelStart + 2] = b;
    }
  }
  
  return createChunk('IDAT', zlib.deflateSync(rawData, { level: 9 }));
}

function createIENDChunk() {
  return createChunk('IEND', Buffer.alloc(0));
}

function createPNG(size, isMaskable) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = createIHDRChunk(size, size);
  const idat = createIDATChunk(size, size, isMaskable);
  const iend = createIENDChunk();
  
  return Buffer.concat([signature, ihdr, idat, iend]);
}

// 生成所有图标
console.log('🎨 生成 PWA 图标...\n');

const sizes = [192, 512];
for (const size of sizes) {
  // 普通图标
  const png = createPNG(size, false);
  const filename = `icon-${size}x${size}.png`;
  writeFileSync(join(iconsDir, filename), png);
  console.log(`✓ 已生成: ${filename}`);
  
  // Maskable 图标
  const maskablePng = createPNG(size, true);
  const maskableFilename = `icon-maskable-${size}x${size}.png`;
  writeFileSync(join(iconsDir, maskableFilename), maskablePng);
  console.log(`✓ 已生成: ${maskableFilename}`);
}

console.log('\n✨ 所有图标生成完成！');
