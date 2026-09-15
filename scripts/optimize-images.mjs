#!/usr/bin/env node
/**
 * Re-encodes the extracted game-sprite PNGs down to the resolution they're actually
 * displayed at (see src/components for the on-screen sizes — everything here maxes out
 * around 90px on screen, sometimes smaller), instead of shipping them at their original
 * extraction resolution (some are 500px+). Cuts public/assets/{magicImages,artifactImages,
 * passiveImages,classImages,baseMagicImages} from ~31MB to a few MB without a visible
 * quality loss at the sizes they're actually rendered.
 *
 * Does NOT touch subjectAnim/ or subjectImages/ (already small, and subjectAnim/archaeologist
 * has a manually-replaced frame — never regenerate that directory) or uiImages/ (full-bleed
 * backgrounds/dividers where exact pixel size matters).
 *
 * Run once: `node scripts/optimize-images.mjs`. Overwrites files in place — commit the result,
 * don't run it repeatedly (re-encoding an already-downscaled PNG is a no-op past the first run
 * since sharp skips upscaling, but there's no reason to re-run it).
 */
import sharp from "sharp";
import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ASSET_ROOT = join(import.meta.dirname, "..", "public", "assets");

/** Max display size on screen, ~2x for retina, rounded up. See per-folder call sites in src/components. */
const TARGETS = [
  { dir: "magicImages", maxSize: 160 },
  { dir: "artifactImages", maxSize: 160 },
  { dir: "passiveImages", maxSize: 160 },
  { dir: "classImages", maxSize: 100 },
  { dir: "baseMagicImages", maxSize: 120 },
];

async function optimizeDir(dir, maxSize) {
  const full = join(ASSET_ROOT, dir);
  const files = readdirSync(full).filter((f) => f.endsWith(".png"));
  let before = 0;
  let after = 0;

  for (const file of files) {
    const path = join(full, file);
    before += statSync(path).size;
    const buffer = await sharp(path)
      .resize(maxSize, maxSize, { fit: "inside", withoutEnlargement: true })
      .png({ palette: true, quality: 90, compressionLevel: 9 })
      .toBuffer();
    after += buffer.length;
    writeFileSync(path, buffer);
  }

  console.log(`${dir}: ${files.length} files, ${(before / 1024 / 1024).toFixed(2)}MB -> ${(after / 1024 / 1024).toFixed(2)}MB`);
}

for (const { dir, maxSize } of TARGETS) {
  await optimizeDir(dir, maxSize);
}
