import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const CLASSIC_DIR = './public/cards/classic';
const OUTPUT_DIR = './public/cards/classic-compressed';

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = fs.readdirSync(CLASSIC_DIR).filter(f => f.endsWith('.jpg'));

console.log(`找到 ${files.length} 张经典卡牌，开始压缩...`);

let totalOriginal = 0;
let totalCompressed = 0;

for (const file of files) {
  const inputPath = path.join(CLASSIC_DIR, file);
  const outputPath = path.join(OUTPUT_DIR, file);
  
  const originalSize = fs.statSync(inputPath).size;
  totalOriginal += originalSize;
  
  await sharp(inputPath)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toFile(outputPath);
  
  const compressedSize = fs.statSync(outputPath).size;
  totalCompressed += compressedSize;
  
  console.log(`✓ ${file}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB`);
}

console.log(`\n压缩完成！`);
console.log(`原始总大小: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
console.log(`压缩后大小: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
console.log(`节省: ${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}%`);
