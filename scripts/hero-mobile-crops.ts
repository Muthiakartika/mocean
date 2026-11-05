/**
 * Makes the phone versions of the home hero photos: the middle 46% of each 1920×1050 slide, full height.
 *
 * On phones and small tablets (up to 777px) the hero frame is taller than the photo, so object-fit: cover only
 * ever shows the middle 36–44% of its width. Sending the full photo meant a 1920px file for a 412px screen.
 * The crop keeps everything that is visible (the frame at 480–777px, aspect 0.81, needs 44%), so the slider
 * looks the same, and the image optimiser can serve a file about half the size.
 *
 * Run once after changing a hero photo:  npx tsx scripts/hero-mobile-crops.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "public/images/uploads/2025/06";
const TARGET_DIR = "public/images/hero-mobile";
const SLIDES = [1, 2, 3, 4, 5, 6].map((n) => `Slider-mocean-${n}.jpg`);
const KEEP = 0.46;

async function main() {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  for (const file of SLIDES) {
    const source = path.join(SOURCE_DIR, file);
    const { width = 0, height = 0 } = await sharp(source).metadata();
    const cropWidth = Math.round(width * KEEP);
    const left = Math.round((width - cropWidth) / 2);
    const target = path.join(TARGET_DIR, file);
    await sharp(source)
      .extract({ left, top: 0, width: cropWidth, height })
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(target);
    console.log(`${target}  ${cropWidth}×${height}  ${(fs.statSync(target).size / 1024).toFixed(0)} KB`);
  }
}

main();
