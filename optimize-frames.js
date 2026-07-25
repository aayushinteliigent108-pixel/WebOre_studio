/**
 * optimize-frames.js — Reduces 240 PNG hero frames to 80 WebP frames
 * 
 * Usage: node optimize-frames.js
 * Requires: Node.js (uses sharp if available, falls back to manual copy)
 * 
 * What it does:
 * 1. Selects every 3rd frame from public/assets/frames/ (00001.png → 00004.png → ...)
 * 2. Converts to WebP for ~60% size reduction
 * 3. Outputs to public/assets/frames-opt/
 * 
 * If sharp is not installed, it copies the PNGs as-is (still reduces count by 3x).
 * To install sharp: npm install sharp
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'public', 'assets', 'frames');
const DEST = path.join(__dirname, 'public', 'assets', 'frames-opt');
const TOTAL_ORIGINAL = 240;
const STEP = 3; // every 3rd frame → 80 frames

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(DEST)) {
    fs.mkdirSync(DEST, { recursive: true });
  }

  let sharp;
  try {
    sharp = require('sharp');
    console.log('Using sharp for WebP conversion');
  } catch {
    console.log('sharp not installed — will copy PNGs as-is (run: npm install sharp for WebP)');
  }

  let converted = 0;
  let totalBytes = 0;

  for (let i = 0; i < TOTAL_ORIGINAL; i += STEP) {
    const num = String(i + 1).padStart(5, '0');
    const srcFile = path.join(SRC, `${num}.png`);
    const destFile = path.join(DEST, sharp ? `${num}.webp` : `${num}.png`);

    if (!fs.existsSync(srcFile)) {
      console.log(`Skipping ${num}.png — not found`);
      continue;
    }

    if (sharp) {
      await sharp(srcFile)
        .resize({ width: 1280, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }

    const stat = fs.statSync(destFile);
    totalBytes += stat.size;
    converted++;
    process.stdout.write(`\rConverted ${converted} frames (${(totalBytes / 1024 / 1024).toFixed(1)}MB)`);
  }

  console.log(`\n\nDone! ${converted} frames written to ${DEST}`);
  console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Format: ${sharp ? 'WebP' : 'PNG (install sharp for WebP)'}`);
}

main().catch(console.error);
